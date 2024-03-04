const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res) => {
	clientManager.addActivity(`tv-${req.body?.mobile ? "mobile" : "desktop"}`, {
		application_id: config.extensions.tv.clientId,

		name: "a video on Apple TV",
		details: req.body?.mobile ? "Details not available" : "Unknown video",
		state: `Currently on Apple TV${req.body?.mobile ? " for iOS" : ""}`,

		assets: {
			small_image: config.extensions.tv.assets.app,
			small_text: `Apple TV${req.body?.mobile ? " for iOS" : ""}`
		},

		type: "WATCHING"
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (extension, req, res) => {
	clientManager.removeActivity(`tv-${req.body?.mobile ? "mobile" : "desktop"}`);

	res.status(204).end();
};

module.exports = new Extension("Apple TV", "/tv", POST, DELETE, config.extensions.tv.clientId, config.extensions.tv.clientSecret);