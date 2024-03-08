const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res, keepAlive) => {
	clientManager.addActivity(`twitch-${req.body?.mobile ? "mobile" : "desktop"}`, {
		application_id: config.extensions.twitch.clientId,

		name: "a live on Twitch",
		details: req.body?.mobile ? "Details not available" : "Unknown live",
		state: `Currently on Twitch${req.body?.mobile ? " for iOS" : ""}`,

		assets: {
			small_image: config.extensions.twitch.assets.app,
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
const DELETE = (extension, req, res) => {
	clientManager.removeActivity(`twitch-${req.body?.mobile ? "mobile" : "desktop"}`);

	res.status(204).end();
};

module.exports = new Extension("Twitch", "/twitch", POST, DELETE, config.extensions.twitch.clientId, config.extensions.twitch.clientSecret);