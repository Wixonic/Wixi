const clientManager = require("../client");
const { Extension } = require("../extension");

const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (_, req, res, keepAlive) => {
	clientManager.addActivity(`website-${req.body?.mobile ? "mobile" : "desktop"}`, {
		name: "my website",
		state: `Currently on wixonic.fr${req.body?.mobile ? " on iOS" : ""}`,

		assets: {
			small_image: config.assets.logo_website,
			small_text: `Wixonic's Website on Safari${req.body?.mobile ? " for iOS" : ""}`
		},

		buttons: [
			"Open my website"
		],
		metadata: {
			button_urls: [
				"https://wixonic.fr"
			]
		},

		type: 3, // WATCHING

		keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`website-${req.body?.mobile ? "mobile" : "desktop"}`, true), keepAlive)
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (_, req, res) => {
	clientManager.removeActivity(`website-${req.body?.mobile ? "mobile" : "desktop"}`);

	res.status(204).end();
};

module.exports = new Extension("Website", "/website", POST, DELETE);