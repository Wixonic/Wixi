const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res, keepAlive) => {
	clientManager.addActivity("pubgm", {
		application_id: config.extensions.pubgm.clientId,

		name: "PUBG Mobile",

		assets: {
			small_image: config.extensions.pubgm.assets.app,
			small_text: "PUBG Mobile"
		},

		timestamps: {
			start: Date.now()
		},

		type: 0, // PLAYING

		keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity("pubgm", true), keepAlive)
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (extension, req, res) => {
	clientManager.removeActivity("pubgm");

	res.status(204).end();
};

module.exports = new Extension("PUBG Mobile", "/pubgm", POST, DELETE, config.extensions.pubgm.clientId, config.extensions.pubgm.clientSecret);