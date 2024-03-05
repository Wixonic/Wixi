const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res) => {
	clientManager.addActivity(`apple-safari-${req.body?.mobile ? "mobile" : "desktop"}`, {
		application_id: config.extensions.apple.clientId,

		name: "Apple's website",
		details: "Unknown details",
		state: `Currently on apple.com${req.body?.mobile ? " on iOS" : ""}`,

		assets: {
			small_image: config.extensions.apple.assets.app,
			small_text: `Apple on Safari${req.body?.mobile ? " for iOS" : ""}`
		},
        
        url: "https://apple.com",

		type: "WATCHING"
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (extension, req, res) => {
	clientManager.removeActivity(`apple-safari-${req.body?.mobile ? "mobile" : "desktop"}`);

	res.status(204).end();
};

module.exports = new Extension("Apple Website", "/safari/apple", POST, DELETE, config.extensions.apple.clientId, config.extensions.apple.clientSecret);