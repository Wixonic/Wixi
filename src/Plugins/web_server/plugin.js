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


httpApp.use((req, res, next) => {
    const url = new URL(req.url, `https://${req.headers.host ?? "server.wixonic.fr"}`);

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
});


const ws = new io.Server(wssServer, {
    cors: {
        origin: "https://server.wixonic.fr"
    },
    serveClient: false
});


fs.readdirSync(path.join(__dirname, "extensions"), {
    encoding: "utf-8"
}).forEach((folderName) => {
    const folder = path.join(__dirname, "extensions", folderName);

    if (fs.statSync(folder).isDirectory()) {
        fs.readdirSync(folder, {
            encoding: "utf-8"
        }).forEach(async (fileName) => {
            if (fileName == "extension.js") {
                const file = path.join(process.cwd(), "extensions", folderName, fileName);

                // try {
                const router = express.Router();
                httpsApp.use(`/${folderName}`, router);

                await require(file)(router, ws);

                log(`Extension at /${path.relative(path.join(__dirname, "extensions"), file)} loaded`);
                /* } catch (e) {
                    log(`Extension at /${path.relative(path.join(__dirname, "extensions"), file)} failed to load: ${e}`);
                } */
            }
        });
    }
});

httpServer.listen(process.env["HTTPPORT"] ?? config.http, () => log(`HTTP | Running on port :${process.env["HTTPPORT"] ?? config.http}`));
httpsServer.listen(process.env["HTTPSPORT"] ?? config.https, () => log(`HTTPS | Running on port :${process.env["HTTPSPORT"] ?? config.https}`));
wssServer.listen(process.env["WSSPORT"] ?? config.wss, () => log(`WSS | Running on port :${process.env["WSSPORT"] ?? config.wss}`));