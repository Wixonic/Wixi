const express = require("express");
const fs = require("fs");
const path = require("path");

const API = require("./api");
const log = require("./log");

const config = require("./config");

/**
 * @param {import("express").Router} router 
 * @param {import("socket.io").Server} _
 */
module.exports = async (router, _) => {
	router.use("/api", (req, res, next) => {
		log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 2xx: ${path.join("/api", req.url)}`)
		res.setHeader("content-type", "application/json");
		next();
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

	const apiRouter = express.Router();
	router.use(`/api/v${config.api.version}`, apiRouter);

	await API.connect(apiRouter);
	await API.cycle(60 * 60 / 3 * 1000); // Every 20 minutes
};