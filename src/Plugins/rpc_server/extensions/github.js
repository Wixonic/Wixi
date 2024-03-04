const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res) => {
	clientManager.addActivity(`github-${req.body?.mobile ? "mobile" : "desktop"}`, {
		application_id: config.extensions.github.clientId,

		name: "repositories on GitHub",
		details: req.body?.mobile ? "Details not available" : "Unknown repository",
		state: `Currently on GitHub${req.body?.mobile ? " for iOS" : ""}`,

		assets: {
			small_image: config.extensions.github.assets.app,
			small_text: `GitHub${req.body?.mobile ? " for iOS" : ""}`
		},

		type: "WATCHING"
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (extension, req, res) => {
	clientManager.removeActivity(`github-${req.body?.mobile ? "mobile" : "desktop"}`);

	res.status(204).end();
};

module.exports = new Extension("GitHub", "/github", POST, DELETE, config.extensions.github.clientId, config.extensions.github.clientSecret);