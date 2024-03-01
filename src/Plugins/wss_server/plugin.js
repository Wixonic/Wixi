const fs = require("fs");
const https = require("https");
const path = require("path");
const WebSocket = require("websocket");

const config = require("./config");
const package = require("./package");

const log = (txt) => console.log(`[${package.displayName ?? package.name}]: ${txt}`);

const server = https.createServer({
	cert: fs.readFileSync("../../SSL/wixonic.fr.cer"),
	key: fs.readFileSync("../../SSL/wixonic.fr.private.key")
}, (req, res) => log(`Incomming request from ${req.socket.remoteAddress ?? "unknown ip"} - ${path.join(req.headers.host, req.url)}`));

server.listen(config.port, () => log(`Running on port :${config.port}`));

const ws = new WebSocket.server({
	autoAcceptConnections: true,
	httpServer: server,
	keepaliveInterval: 5000,
	useNativeKeepalive: true
});

ws.on("request", (req) => {
	const connection = req.accept("echo-protocol", req.origin);
});