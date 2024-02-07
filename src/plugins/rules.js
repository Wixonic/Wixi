const { guild } = require("../client");
const { info } = require("../console");

module.exports = {
	start: (_, router) => {
		router.get("/rules", (_, res) => {
			res.setHeader("location", guild().rulesChannel.url).sendStatus(307);
			info(`${res.socket?.remoteAddress ?? "Unknow IP"} - Redirected to #${guild().rulesChannel.name}`);
		});
	}
};