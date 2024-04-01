const express = require("express");
const fs = require("fs");
const path = require("path");

const { cycle } = require("./cycle");
const log = require("./log");

const config = require("./config");

/**
 * @param {import("express").Router} router 
 * @param {import("socket.io").Server} _
 */
module.exports = async (router, _) => {
	router.get(/^\/users\/([\w]+)\/(.*)?$/m, (req, res) => {
		const id = req.params[0];
		const extraPath = req.params[1];

		if (extraPath) {
			log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 2xx: ${req.path}`)

			const file = path.join(__dirname, "website", "users", ":id", extraPath);

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
		} else {
			const file = path.join(__dirname, "website", "users", ":id", "index.html");
			const user = path.join(config.root, "users", id, "latest.json");

			if (fs.existsSync(file) && fs.existsSync(user)) {
				const userData = JSON.parse(fs.readFileSync(user));
				const content = String(fs.readFileSync(file)).split("[[NAME]]").join(userData.name).split("[[POSSESSIVE-NAME]]").join(userData.name + (userData.name.endsWith("s") ? "'" : "'s")).split("[[ID]]").join(userData.id);
				res.writeHead(200).write(content);
			} else res.writeHead(404);
		}

		res.end();
	});

	router.use("/api", (req, res, next) => {
		log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 2xx: ${path.join("/api", req.url)}`)
		res.setHeader("content-type", "application/json");
		next();
	});

	router.get("/api", (_, res) => {
		res.writeHead(200).write(JSON.stringify({
			status: "online"
		}, null, 4));
		res.end();
	});

	router.get("/api/brawlers", (_, res) => {
		const file = path.join(config.root, "brawlers.json");

		if (fs.existsSync(file)) res.writeHead(200).write(fs.readFileSync(file));
		else res.writeHead(500).write(JSON.stringify({
			code: 500,
			error: "Brawlers not found"
		}, null, 4));

		res.end();
	});

	router.get("/api/users", (_, res) => {
		const folder = path.join(config.root, "users");

		if (fs.existsSync(folder)) {
			const users = {};

			for (const file of fs.readdirSync(folder)) {
				const userFolder = path.join(folder, file);
				const userFile = path.join(userFolder, "latest.json");
				if (fs.existsSync(userFolder) && fs.statSync(userFolder).isDirectory() && fs.existsSync(userFile)) users[file] = JSON.parse(fs.readFileSync(userFile)).name;
			}

			res.writeHead(200).write(JSON.stringify(users, null, 4));
		} else res.writeHead(500).write(JSON.stringify({
			code: 500,
			error: "Users not found"
		}, null, 4));

		res.end();
	});

	router.get("/api/users/:id", (req, res) => {
		const file = path.join(config.root, "users", req.params.id, "latest.json");

		if (fs.existsSync(file)) res.writeHead(200).write(fs.readFileSync(file));
		else res.writeHead(404).write(JSON.stringify({
			code: 404,
			error: `User #${req.params.id} is not tracked`
		}, null, 4));

		res.end();
	});

	router.get("/api/users/:id/stats", (req, res) => {
		const file = path.join(config.root, "users", req.params.id, "stats.json");

		if (fs.existsSync(file)) res.writeHead(200).write(fs.readFileSync(file));
		else res.writeHead(404).write(JSON.stringify({
			code: 404,
			error: `User #${req.params.id} is not tracked`
		}, null, 4));

		res.end();
	});

	router.use("/api", (_, res) => {
		res.writeHead(404).write(JSON.stringify({
			code: 404,
			error: "Not Found"
		}, null, 4));

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

	await cycle(3600 / 4 * 1000); // Every 15 minutes
};