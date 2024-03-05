const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res) => {
	clientManager.addActivity(`website-safari-${req.body?.mobile ? "mobile" : "desktop"}`, {
		application_id: config.extensions.website.clientId,

		name: "my website",
		details: req.body?.mobile ? "Details not available" : "Unknown details",
		state: `Currently on wixonic.fr${req.body?.mobile ? " on iOS" : ""}`,

		assets: {
			small_image: config.extensions.website.assets.app,
			small_text: `Wixonic's Website on Safari${req.body?.mobile ? " for iOS" : ""}`
		},
        
        url: "https://wixonic.fr",

		type: "WATCHING"
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (extension, req, res) => {
	clientManager.removeActivity(`website-safari-${req.body?.mobile ? "mobile" : "desktop"}`);

	res.status(204).end();
};

module.exports = new Extension("Website", "/safari/website", POST, DELETE, config.extensions.website.clientId, config.extensions.website.clientSecret);