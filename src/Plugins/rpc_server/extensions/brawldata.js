const clientManager = require("../client");
const { Extension } = require("../extension");

const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (_, req, res, keepAlive) => {
	clientManager.addActivity(`brawldata-${req.body?.mobile ? "mobile" : "desktop"}`, {
		name: "stats on Brawl Stars",
		state: `Currently on BrawlData${req.body?.mobile ? " on iOS" : ""}`,

		assets: {
			small_image: config.assets.logo_brawldata,
			small_text: `BrawlData on Safari${req.body?.mobile ? " for iOS" : ""}`
		},

		buttons: [
			"See stats",
			"See my stats"
		],
		metadata: {
			button_urls: [
				"https://server.wixonic.fr/brawldata",
				"https://server.wixonic.fr/brawldata/players/LJVC2CU08/"
			]
		},

		type: 3, // WATCHING

		keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`brawldata-${req.body?.mobile ? "mobile" : "desktop"}`, true), keepAlive)
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (_, req, res) => {
	clientManager.removeActivity(`brawldata-${req.body?.mobile ? "mobile" : "desktop"}`);

	res.status(204).end();
};

module.exports = new Extension("BrawlData", "/brawldata", POST, DELETE);