const { info } = require("../console");
const settings = require("../settings");
const { guild } = require("../client");

module.exports = {
	start: (_, router) => {
		router.get("/help", async (_, res) => {
			const channel = guild().channels.cache.get(settings.channels.help);
			res.setHeader("location", channel.url).sendStatus(307);
			info(`${res.socket?.remoteAddress ?? "Unknow IP"} - Redirected to #${channel.name}`);
		});
	}
};