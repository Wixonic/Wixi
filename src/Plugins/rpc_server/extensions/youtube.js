const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res) => {
	clientManager.addActivity(`youtube-${req.body?.mobile ? "mobile" : "desktop"}`, {
		application_id: config.extensions.youtube.clientId,

		name: "a video on YouTube",
		details: req.body?.mobile ? "Details not available" : "Unknown video",
		state: `Currently on YouTube${req.body?.mobile ? " for iOS" : ""}`,

		assets: {
			small_image: config.extensions.youtube.assets.app,
			small_text: `YouTube${req.body?.mobile ? " for iOS" : ""}`
		},

		type: "WATCHING"
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (extension, req, res) => {
	clientManager.removeActivity(`youtube-${req.body?.mobile ? "mobile" : "desktop"}`);

	res.status(204).end();
};

module.exports = new Extension("YouTube", "/youtube", POST, DELETE, config.extensions.youtube.clientId, config.extensions.youtube.clientSecret);