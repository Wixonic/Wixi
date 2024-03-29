const clientManager = require("../client");
const { Extension } = require("../extension");

const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (_, req, res, keepAlive) => {
	const type = req.body?.type ?? "unknow";

	switch (type) {
		case "app":
			clientManager.addActivity(`appledev-${type}`, {
				name: "developer stuff",
				details: "Watching stuff for developers",
				state: "On Apple Developer for iOS",

				assets: {
					small_image: config.assets.logo_apple_developer,
					small_text: "Apple Developer for iOS"
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`appledev-${type}`, true), keepAlive)
			});
			break;

		case "wwdc":
			clientManager.addActivity(`appledev-${type}`, {
				name: "WWDC 24",
				details: "Watching news for developers",
				state: "On Apple developer",

				assets: {
					small_image: config.assets.logo_wwdc,
					small_text: "WWDC 24"
				},

				buttons: [
					"Watch WWDC 24"
				],
				metadata: {
					button_urls: [
						"https://developer.apple.com/wwdc24/"
					]
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`appledev-${type}`, true), keepAlive)
			});
			break;

		default:
			clientManager.addActivity(`appledev-${type}`, {
				name: "developer stuff",
				details: "Watching stuff for developers",
				state: "On Apple Developer",

				assets: {
					small_image: config.assets.logo_apple_developer,
					small_text: "Apple Developer"
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`appledev-${type}`, true), keepAlive)
			});
			break;
	};

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (_, req, res) => {
	clientManager.removeActivity(`appledev-${req.body?.type ?? "unknow"}`);

	res.status(204).end();
};

module.exports = new Extension("Apple Developer", "/appledev", POST, DELETE);