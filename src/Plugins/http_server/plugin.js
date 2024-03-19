const express = require("express");
const fs = require("fs");
const http = require("http");
const path = require("path");

const config = require("./config");
const package = require("./package");

const app = express();

const log = (txt) => console.log(`[${package.displayName ?? package.name}]: ${txt}`);

app.use((req, _, next) => {
	log(`Incomming request from ${req.socket.remoteAddress ?? "unknown ip"} - ${path.join(req.headers.host, req.url)}`);
	next();
});

app.use((req, res, next) => {
	const url = new URL(req.url, `https://${req.headers.host}`);

	res.writeHead(301, {
		"location": url.href
	}).end();

	log(`Redirected to: ${url.href}`);

	next();
});

const server = http.createServer(app);
server.listen(config.port, () => log(`Running on port :${config.port}`));