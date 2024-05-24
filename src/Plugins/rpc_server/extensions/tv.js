const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (_, req, res, keepAlive) => {
	clientManager.addActivity(`tv-${req.body?.mobile ? "mobile" : "desktop"}`, {
		name: "a video on Apple TV",
		details: req.body?.mobile ? "Details not available" : "Unknown video",
		state: `Currently on Apple TV${req.body?.mobile ? " for iOS" : ""}`,

		assets: {
			small_image: config.assets.logo_apple_tv,
			small_text: `Apple TV${req.body?.mobile ? " for iOS" : ""}`
		},

		type: 3, // WATCHING

		keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`tv-${req.body?.mobile ? "mobile" : "desktop"}`, true), keepAlive)
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (_, req, res) => {
	clientManager.removeActivity(`tv-${req.body?.mobile ? "mobile" : "desktop"}`);

	res.status(204).end();
};

module.exports = new Extension("Apple TV", "/tv", POST, DELETE);