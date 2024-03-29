const clientManager = require("../client");
const { Extension } = require("../extension");
const request = require("../request");

const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (_, req, res, keepAlive) => {
	clientManager.addActivity(`discord-${req.body?.mobile ? "mobile" : "desktop"}`, {
		name: "servers on Discord",
		details: req.body?.mobile ? "Details not available" : "Unknown details",
		state: `Currently on Discord${req.body?.mobile ? " for iOS" : ""}`,

		assets: {
			small_image: config.assets.logo_discord,
			small_text: `Discord${req.body?.mobile ? " for iOS" : ""}`
		},

		buttons: [
			"Join WixiLand (Discord server)"
		],
		metadata: {
			button_urls: [
				(await request({
					type: "headers",
					url: "https://go.wixonic.fr/discord"
				}))["location"]
			]
		},

		type: 3, // WATCHING

		keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`discord-${req.body?.mobile ? "mobile" : "desktop"}`, true), keepAlive)
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (_, req, res) => {
	clientManager.removeActivity(`discord-${req.body?.mobile ? "mobile" : "desktop"}`);

	res.status(204).end();
};

module.exports = new Extension("Discord", "/discord", POST, DELETE, config.extensions.discord.clientId, config.extensions.discord.clientSecret);