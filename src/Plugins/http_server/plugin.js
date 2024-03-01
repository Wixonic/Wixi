const express = require("express");
const fs = require("fs");
const http = require("http");

const config = require("./config");
const package = require("./package");

const app = express();

app.get("/ping", (req, res) => res.send("Pong"));

const server = http.createServer(app);

server.listen(config.port, () => console.log(`${package.displayName ?? package.name} running on port :${config.port}`));