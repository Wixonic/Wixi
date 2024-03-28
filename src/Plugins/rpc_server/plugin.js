const express = require("express");
const fs = require("fs");
const https = require("https");
const path = require("path");

const config = require("./config");
const log = require("./log");

app.get("/authorize", (req, res) => {

});

app.use((req, _, next) => {
    log(`Incomming request from ${req.socket.remoteAddress ?? "unknown ip"} - ${req.method} ${path.join(req.headers["host"], req.url)}`);
    next();
});

const server = https.createServer({
    cert: fs.readFileSync("../../SSL/wixonic.fr.cer"),
    key: fs.readFileSync("../../SSL/wixonic.fr.private.key")
}, app);

server.listen(config.port, () => log(`Running on port :${config.port}`));