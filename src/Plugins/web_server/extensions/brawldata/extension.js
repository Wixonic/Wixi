const express = require("express");
const fs = require("fs");
const path = require("path");

const API = require("./api");
const log = require("./log");

const config = require("./config");
const request = require("./request");
const { readPlayer } = require("./converter");

/**
 * @param {import("express").Router} router 
 * @param {import("socket.io").Server} _
 */
module.exports = async (router, _) => {
	const apiRouter = express.Router();

	router.use("/api", (req, res, next) => {
		log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 2xx: ${path.join("/api", req.url)}`)
		res.setHeader("content-type", "application/json");
		next();
	});

	router.use(`/api/v${config.api.version}`, apiRouter);

	router.use("/api", (req, res) => {
		log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 404: ${path.join("/api", req.url)}`)

		res.writeHead(404).write(JSON.stringify({
			code: 404,
			error: "Not Found"
		}, null, 4));

		res.end();
	});


	router.use("/assets", express.static(path.join(__dirname, "assets"), {
		setHeaders: (res, filePath) => {
			res.header("Cache-Control", "max-age=604800"); // One week
			log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 2xx: /${path.relative(__dirname, filePath)}`);
		}
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

	router.use("/assets/*", (_, res) => res.writeHead(404).end());


	router.get(/^\/players\/([\w]+)\/(.*)?$/m, (req, res) => {
		const id = "#" + req.params[0];
		const extraPath = req.params[1];

		if (extraPath) {
			log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 2xx: ${req.path}`)

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

	router.use(express.static(path.join(__dirname, "website"), {
		setHeaders: (res, filePath) => log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 2xx: /${path.relative(__dirname, filePath)}`)
	}));

	router.use((req, res) => {
		const url = new URL("/brawldata", `https://${req.headers.host ?? "server.wixonic.fr"}`);

		res.writeHead(302, {
			location: url.href
		});

		log(`HTTPS | Redirected from ${req.path} to: ${url.href}`);

		res.end();
	});

	await API.connect(apiRouter);
	await API.cycle((config.cycle * 60) * 1000); // Every 10 minutes
};