const express = require("express");
const fs = require("fs");
const http = require("http");
const path = require("path");

const config = require("./config");
const package = require("./package");

const app = express();

const log = (txt) => console.log(`[${package.displayName ?? package.name}]: ${txt}`);

app.use((req, res, next) => {
	log(`Incomming request from ${req.socket.remoteAddress ?? "unknown ip"} - ${path.join(req.headers.host, req.url)}`);
	next();
});

const server = http.createServer(app);
server.listen(config.port, () => log(`Running on port :${config.port}`));