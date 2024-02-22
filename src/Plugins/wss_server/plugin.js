const WebSocket = require("ws");

const config = require("./config");

const server = new WebSocket.Server({
	port: config.port
});

server.on("connection", (socket) => {
	socket.on("open", () => {

	});
});