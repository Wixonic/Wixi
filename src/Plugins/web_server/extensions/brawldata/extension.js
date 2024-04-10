const express = require("express");
const fs = require("fs");
const path = require("path");

const API = require("./api");
const { readPlayer } = require("./converter");
const log = require("./log");
const { toProperCase } = require("./utils");

const config = require("./config");
const request = require("./request");

/**
 * @param {import("express").Router} router 
 * @param {import("socket.io").Server} _
 */
module.exports = async (router, _) => {
	const apiRouter = express.Router();

	router.use("/api", (_, res, next) => {
		res.setHeader("content-type", "application/json");
		next();
	});

	router.use("/api", apiRouter);

	router.use("/api", (req, res) => {
		log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 404: ${path.join("/api", req.url)}`)

		res.writeHead(404).write(JSON.stringify({
			code: 404,
			error: "Not Found"
		}, null, 4));

		res.end();
	});


	router.use("/assets", express.static(path.join(__dirname, "assets"), {
		setHeaders: (res) => res.header("Cache-Control", "max-age=604800") // One week
	}));

	router.get("/assets/icon/player/:id.png", async (req, res) => {
		const directoryPath = path.join(__dirname, "assets", "icon", "player");
		const filePath = path.join(directoryPath, req.params.id + ".png");

		if (!fs.existsSync(filePath)) {
			const image = await request({
				type: "raw",
				url: `https://cdn-old.brawlify.com/profile/${Number(req.params.id) + 28000000}.png`
			});

			if (!image.error) {
				if (!fs.existsSync(directoryPath)) fs.mkdirSync(directoryPath, { recursive: true });
				fs.writeFileSync(filePath, image);
				res.writeHead(200, {
					"content-type": "image/png"
				});

				res.write(image);
			} else res.writeHead(404, {
				"content-type": "image/png"
			});
		} else res.writeHead(500, {
			"content-type": "image/png"
		});

		res.end();
	});

	router.get("/assets/icon/brawler/:id.png", async (req, res) => {
		const directoryPath = path.join(__dirname, "assets", "icon", "brawler");
		const filePath = path.join(directoryPath, req.params.id + ".png");

		if (!fs.existsSync(filePath)) {
			const brawlers = JSON.parse(fs.readFileSync(config.paths.brawlers(), "utf-8"));

			const image = await request({
				type: "raw",
				url: `https://cdn-old.brawlify.com/brawler-bs/${toProperCase(brawlers[req.params.id].name).split(" ").join("-").split(".").join("")}.png`
			});

			if (!image.error) {
				if (!fs.existsSync(directoryPath)) fs.mkdirSync(directoryPath, { recursive: true });
				fs.writeFileSync(filePath, image);
				res.writeHead(200, {
					"content-type": "image/png"
				});

				res.write(image);
			} else res.writeHead(404, {
				"content-type": "image/png"
			});
		} else res.writeHead(500, {
			"content-type": "image/png"
		});

		res.end();
	});

	router.get("/assets/icon/rank/:id.png", async (req, res) => {
		const fileName = ["bronze", "silver", "gold", "diamond", "mythic", "legendary", "masters"][Math.floor((req.params.id - 1) / 3)];
		const directoryPath = path.join(__dirname, "assets", "icon", "rank");
		const filePath = path.join(directoryPath, fileName + ".png");

		if (fs.existsSync(filePath)) {
			res.writeHead(200, {
				"content-type": "image/png"
			});

			res.write(fs.readFileSync(filePath));
		} else res.writeHead(404, {
			"content-type": "image/png"
		});

		res.end();
	});

	router.use("/assets/*", (_, res) => res.writeHead(404).end());


	router.get(/^\/players\/([\w]+)\/(.*)?$/m, (req, res) => {
		const id = "#" + req.params[0];
		const extraPath = req.params[1];

		if (extraPath) {
			const file = path.join(__dirname, "website", "players", ":id", extraPath);

			if (fs.existsSync(file)) {
				const content = fs.readFileSync(file);

				let type;

				switch (true) {
					case extraPath.endsWith(".css"):
						type = "text/css";
						break;

					case extraPath.endsWith(".js"):
						type = "text/javascript";
						break;

					default:
						type = "text/plain";
						break;
				}

				res.writeHead(200, {
					"content-type": type
				}).write(content);
			} else res.writeHead(404);
		} else if (fs.existsSync(config.paths.player(id))) {
			const file = path.join(__dirname, "website", "players", ":id", "index.html");
			const playerData = readPlayer(id);
			const name = Object.values(playerData.name).at(-1);

			const content = String(fs.readFileSync(file)).split("[[NAME]]").join(name).split("[[POSSESSIVE-NAME]]").join(name + (name.endsWith("s") ? "'" : "'s")).split("[[ID]]").join(id.slice(1));

			res.writeHead(200, {
				"content-type": "text/html"
			}).write(content);
		} else res.writeHead(404);

		res.end();
	});

	router.use(express.static(path.join(__dirname, "website")));

	router.use((req, res) => {
		const url = new URL("/brawldata", `https://${req.headers.host ?? "server.wixonic.fr"}`);

		res.writeHead(302, {
			location: url.href
		});

		log(`HTTPS | Redirected from ${req.path} to: ${url.href}`);

		res.end();
	});

	await API.connect(apiRouter);

	const delay = (process.env.BRAWLDATACYCLEDELAY ?? config.cycle) * 60 * 1000;
	const remaining = Math.ceil(Date.now() / delay) * delay - Date.now();

	if (process.env.BRAWLDATACYCLESYNC == "false") {
		API.cycle(delay);
		log(`Cycle set to every ${config.cycle} minutes.`);
	} else {
		setTimeout(() => API.cycle(delay), remaining);
		log(`Cycle set to every ${config.cycle} minutes. Next cycle in ${remaining > 60000 ? Math.ceil(remaining / 60000) + " minutes" : Math.ceil(remaining / 1000) + " seconds"}.`);
	}
};