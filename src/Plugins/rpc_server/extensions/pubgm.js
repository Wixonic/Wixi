const clientManager = require("../client");
const { Extension } = require("../extension");

const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (_, _2, res, keepAlive) => {
	clientManager.addActivity("pubgm", {
		name: "PUBG Mobile",

		assets: {
			small_image: config.assets.logo_pubg_mobile,
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
const DELETE = (_, _2, res) => {
	clientManager.removeActivity("pubgm");

	res.status(204).end();
};

module.exports = new Extension("PUBG Mobile", "/pubgm", POST, DELETE);