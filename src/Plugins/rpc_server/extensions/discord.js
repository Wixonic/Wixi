const { Extension } = require("../extension");

const config = require("../config");

let last = null;

module.exports = new Extension("Discord", "/discord", (extension, req, res) => {
	if (req.body?.mobile) {
		extension.client.setActivity({
			details: "Currently on Discord for iOS",

			smallImageKey: "app",
			smallImageText: "Discord Mobile RPC"
		});
	} else {

	}

	last = req.body;

	res.status(204).end();
}, (extension, req, res) => {
	if (last?.mobile == req.body?.mobile) {
		extension.client.clearActivity();
		last = null;
	}

	res.status(204).end();
}, config.extensions.discord.clientId, config.extensions.discord.clientSecret);