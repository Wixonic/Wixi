const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res, keepAlive) => {
	clientManager.addActivity("brawlstars", {
		application_id: config.extensions.brawlstars.clientId,

		name: "Brawl Stars",

		assets: {
			small_image: config.extensions.brawlstars.assets.app,
			small_text: "Brawl Stars"
		},

		timestamps: {
			start: Date.now()
		},

		type: 0, // PLAYING

		keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity("brawlstars", true), keepAlive)
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (extension, req, res) => {
	clientManager.removeActivity("brawlstars");

	res.status(204).end();
};

module.exports = new Extension("Brawl Stars", "/brawlstars", POST, DELETE, config.extensions.brawlstars.clientId, config.extensions.brawlstars.clientSecret);