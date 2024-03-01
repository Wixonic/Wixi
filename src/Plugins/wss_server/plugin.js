const fs = require("fs");
const https = require("https");
const WebSocket = require("websocket");

const config = require("./config");

const server = https.createServer({
	cert: fs.readFileSync("../../SSL/wixonic.fr.cer"),
	key: fs.readFileSync("../../SSL/wixonic.fr.private.key")
}, (req, res) => {
	console.log("Yo");
});

server.listen(config.port, () => console.log("Server running on port :" + config.port));

const ws = new WebSocket.server({
	autoAcceptConnections: true,
	httpServer: server,
	keepaliveInterval: 5000,
	useNativeKeepalive: true
});

ws.on("request", (req) => {
	const connection = req.accept("echo-protocol", req.origin);
});