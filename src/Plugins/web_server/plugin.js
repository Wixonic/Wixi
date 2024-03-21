const express = require("express");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const io = require("socket.io");

const log = require("./log");

const config = require("./config");


const httpApp = express();
const httpsApp = express();


httpApp.use((req, _, next) => {
    log(`HTTP | Incomming request from ${req.socket.remoteAddress ?? "unknown ip"} - ${path.join(req.headers.host, req.url)}`);
    next();
});

httpsApp.use((req, _, next) => {
    log(`HTTPS | Incomming request from ${req.socket.remoteAddress ?? "unknown ip"} - ${path.join(req.headers.host, req.url)}`);
    next();
});


httpApp.use((req, res, next) => {
    const url = new URL(req.url, `https://${req.headers.host}`);

    res.writeHead(301, {
        "location": url.href
    }).end();

    log(`HTTP | Redirected to: ${url.href}`);

    next();
});

httpsApp.all("/", (req, res, next) => {
    const url = new URL(req.url, `https://wixonic.fr`);

    res.writeHead(302, {
        "location": url.href
    }).end();

    log(`HTTPS | Redirected to: ${url.href}`);

    next();
});


const httpServer = http.createServer(httpApp);

const httpsServer = https.createServer({
    cert: fs.readFileSync("../../SSL/wixonic.fr.cer"),
    key: fs.readFileSync("../../SSL/wixonic.fr.private.key")
}, httpsApp);

const wssServer = https.createServer({
    cert: fs.readFileSync("../../SSL/wixonic.fr.cer"),
    key: fs.readFileSync("../../SSL/wixonic.fr.private.key")
}, (req, _) => log(`WSS | Incomming request from ${req.socket.remoteAddress ?? "unknown ip"} - ${path.join(req.headers["host"], req.url)}`));


const ws = new io.Server(wssServer, {
    cors: {
        origin: "https://server.wixonic.fr"
    },
    serveClient: false
});


fs.readdirSync("./extensions", {
    encoding: "utf-8"
}).forEach((folderName) => {
    const folder = `./${path.join("extensions", folderName)}`;

    if (fs.statSync(folder).isDirectory()) {
        fs.readdirSync(folder, {
            encoding: "utf-8"
        }).forEach((fileName) => {
            if (fileName == "extension.js") {
                const file = path.join(process.cwd(), "extensions", folderName, fileName);

                try {
                    const router = express.Router();
                    httpsApp.use(`/${folderName}`, router);

                    require(file)(router, ws, folderName);

                    log(`Extension at "${file}" loaded`);
                } catch (e) {
                    log(`Extension at "${file}" failed to load: ${e}`);
                }
            }
        });
    }
});


httpServer.listen(config.http, () => log(`HTTP | Running on port :${config.http}`));
httpsServer.listen(config.https, () => log(`HTTPS | Running on port :${config.https}`));
wssServer.listen(config.wss, () => log(`WSS | Running on port :${config.wss}`));