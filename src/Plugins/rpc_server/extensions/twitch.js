const clientManager = require("../client");
const { Extension } = require("../extension");

const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (_, req, res, keepAlive) => {
	clientManager.addActivity(`twitch-${req.body?.mobile ? "mobile" : "desktop"}`, {
		name: "a live on Twitch",
		details: req.body?.mobile ? "Details not available" : "Unknown live",
		state: `Currently on Twitch${req.body?.mobile ? " for iOS" : ""}`,

		assets: {
			small_image: config.assets.logo_twitch,
			small_text: `Twitch${req.body?.mobile ? " for iOS" : ""}`
		},

		type: 3, // WATCHING

		keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`twitch-${req.body?.mobile ? "mobile" : "desktop"}`, true), keepAlive)
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (_, req, res) => {
	clientManager.removeActivity(`twitch-${req.body?.mobile ? "mobile" : "desktop"}`);

	res.status(204).end();
};

module.exports = new Extension("Twitch", "/twitch", POST, DELETE);