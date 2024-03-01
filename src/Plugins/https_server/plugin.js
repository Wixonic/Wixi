const express = require("express");
const fs = require("fs");
const https = require("https");
const path = require("path");

const config = require("./config");
const package = require("./package");

const app = express();

const log = (txt) => console.log(`[${package.displayName ?? package.name}]: ${txt}`);

app.use((req, res, next) => {
    log(`Incomming request from ${req.socket.remoteAddress ?? "unknown ip"} - ${path.join(req.headers.host, req.url)}`);
    next();
});

const server = https.createServer({
    cert: fs.readFileSync("../../SSL/wixonic.fr.cer"),
    key: fs.readFileSync("../../SSL/wixonic.fr.private.key")
}, app);

server.listen(config.port, () => log(`Running on port :${config.port}`));