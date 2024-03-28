const express = require("express");
const fs = require("fs");
const https = require("https");
const path = require("path");

const { Client, Token } = require("./client");
const log = require("./log");

const config = require("./config");

const app = express();

app.get("/authorize", async (req, res) => {
    if ("errors" in req.query) {
        res.writeHead(500).end(req.query?.message ?? "Unknown error");
        log(`[Discord OAuth2] ${req.query?.message ?? req.query?.code ?? "Unknown error"}`);
    } else if ("code" in req.query) {
        const token = await Token.getTokenFromCode(req.query.code);

        if (token.destroyed != false || token.expired) res.writeHead(500).end(token.destroyed);
        else {
            const client = new Client(token);

            res.writeHead(307, {
                "Location": "https://wixonic.fr"
            }).end();
        }
    } else {
        if (!res.headersSent) res.writeHead(401).end("Query doesn't contain code");
        log("Query doesn't contain code: " + JSON.stringify(req.query, null, 2));
    }
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