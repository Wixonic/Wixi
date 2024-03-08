const express = require("express");
const fs = require("fs");
const https = require("https");
const path = require("path");

const config = require("./config");
const log = require("./log");

const app = express();

app.use(express.json());

app.use((_, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Server-Keep-Alive");
    next();
});

fs.readdirSync("./extensions", {
    encoding: "utf-8"
}).forEach((file) => {
    if (file.endsWith("js")) {
        try {
            /**
             * @type {import("./extension").Extension}
             */
            const extension = require(path.join(__dirname, "extensions", file));

            app.post(extension.path, (req, res) => {
                try {
                    extension.POST(extension, req, res, req.headers["server-keep-alive"] ? Number(req.headers["server-keep-alive"]) * 1000 : null);
                    log(`${extension.name} - POST${req.headers["server-keep-alive"] ? " - Keep-Alive: " + req.headers["server-keep-alive"] + "s" : ""}`);
                } catch (e) {
                    if (!res.headersSent && res.writable) res.writeHead(400).send(e.toString());
                    log(`${extension.name} - Failed to POST: ${e} `);
                }
            });

            app.delete(extension.path, (req, res) => {
                try {
                    extension.DELETE(extension, req, res);
                    log(`${extension.name} - DELETE`);
                } catch (e) {
                    if (!res.headersSent && res.writable) res.writeHead(400).send(e.toString());
                    log(`${extension.name} - Failed to DELETE: ${e} `);
                }
            });

            app.options(extension.path, (req, res) => res.writeHead(204).end());

            log(`${extension.name} extension loaded`);
        } catch (e) {
            log(`Extension at "${file}" failed to load: ${e} `);
        }
    }
});

app.use((req, _, next) => {
    log(`Incomming request from ${req.socket.remoteAddress ?? "unknown ip"} - ${req.method} ${path.join(req.headers.host, req.url)} `);
    next();
});

const server = https.createServer({
    cert: fs.readFileSync("../../SSL/wixonic.fr.cer"),
    key: fs.readFileSync("../../SSL/wixonic.fr.private.key")
}, app);

server.listen(config.port, () => log(`Running on port:${config.port} `));