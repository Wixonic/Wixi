const clientManager = require("../client");
const { Extension } = require("../extension");

const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (_, _2, res, keepAlive) => {
	clientManager.addActivity("brawlstars", {
		name: "Brawl Stars",

		assets: {
			small_image: config.assets.logo_brawl_stars,
			small_text: "Brawl Stars"
		},

		timestamps: {
			start: Date.now()
		},

		buttons: [
			"See my stats"
		],
		metadata: {
			button_urls: [
				"https://server.wixonic.fr/brawldata/players/LJVC2CU08/"
			]
		},

		type: 0, // PLAYING

		keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity("brawlstars", true), keepAlive)
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (_, _2, res) => {
	clientManager.removeActivity("brawlstars");

	res.status(204).end();
};

module.exports = new Extension("Brawl Stars", "/brawlstars", POST, DELETE);