const express = require("express");
const fs = require("fs");
const https = require("https");

const config = require("./config");
const package = require("./package");

const app = express();

app.get("/ping", (req, res) => res.send("Pong"));

const server = https.createServer({
    cert: fs.readFileSync("../../SSL/wixonic.fr.cer"),
    key: fs.readFileSync("../../SSL/wixonic.fr.private.key")
}, app);

server.listen(config.port, () => console.log(`${package.displayName ?? package.name} running on port :${config.port}`));