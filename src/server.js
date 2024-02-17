const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const io = require("socket.io");

const config = require("./config");

const app = express();

http.createServer((req, res) => {
	res.writeHead(301, {
		"location": new URL(req.url ?? "/", config.host).href
	}).end();
}).listen(config.http, () => console.info("http server listening to :" + config.http));

https.createServer({
	cert: fs.readFileSync(path.join(__dirname, config.ssl.cert)),
	key: fs.readFileSync(path.join(__dirname, config.ssl.key))
}, app).listen(config.https, () => console.info("https server listening to :" + config.https));

app.use((req, res, next) => {
	console.log(`${req.method} - ${req.url}`);
	next();
});

module.exports = app;