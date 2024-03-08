const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res, keepAlive) => {
	clientManager.addActivity(`discord-${req.body?.mobile ? "mobile" : "desktop"}`, {
		application_id: config.extensions.discord.clientId,

		name: "servers on Discord",
		details: req.body?.mobile ? "Details not available" : "Unknown details",
		state: `Currently on Discord${req.body?.mobile ? " for iOS" : ""}`,

		assets: {
			small_image: config.extensions.discord.assets.app,
			small_text: `Discord${req.body?.mobile ? " for iOS" : ""}`
		},

		type: 3, // WATCHING

		keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`discord-${req.body?.mobile ? "mobile" : "desktop"}`, true), keepAlive)
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (extension, req, res) => {
	clientManager.removeActivity(`discord-${req.body?.mobile ? "mobile" : "desktop"}`);

	res.status(204).end();
};

module.exports = new Extension("Discord", "/discord", POST, DELETE, config.extensions.discord.clientId, config.extensions.discord.clientSecret);