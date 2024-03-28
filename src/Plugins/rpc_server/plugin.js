const express = require("express");
const fs = require("fs");
const https = require("https");
const path = require("path");

const { Client } = require("./client");
const log = require("./log");

const config = require("./config");

const app = express();
const client = new Client();

app.use((req, _, next) => {
    log(`Incomming request from ${req.socket.remoteAddress ?? "unknown ip"} - ${req.method} ${path.join(req.headers["host"], req.url)}`);
    next();
});

client.selfbot.on("ready", (selfbot) => {
    selfbot.user.setPresence({
        activities: [
            {
                application_id: config.applicationId,
                type: "WATCHING",
                name: "outside",
                details: "I'm touching grass",
                state: "Try it!",
                assets: [

                ],
                buttons: [
                    "Website",
                    "WixiLand"
                ],
                metadata: {
                    button_urls: [
                        "https://wixonic.fr",
                        "https://go.wixonic.fr/discord"
                    ]
                }
            }
        ],
        afk: true,
        status: "invisible"
    });

    client.log(`Logged in as ${selfbot.user.username}`);
});

client.selfbot.login(config.token);

const server = https.createServer({
    cert: fs.readFileSync("../../SSL/wixonic.fr.cer"),
    key: fs.readFileSync("../../SSL/wixonic.fr.private.key")
}, app);

server.listen(config.port, () => log(`Running on port :${config.port}`));