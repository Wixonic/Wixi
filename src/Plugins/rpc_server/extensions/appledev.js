const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res, keepAlive) => {
	const type = req.body?.type ?? "unknow";

	switch (type) {
		case "app":
			clientManager.addActivity(`appledev-${type}`, {
				application_id: config.extensions.appledev.clientId,

				name: "news",
				details: "Watching stuff for developers",
				state: "On Apple Developer for iOS",

				assets: {
					small_image: config.extensions.appledev.assets.app,
					small_text: "Apple Developer"
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`appledev-${type}`, true), keepAlive)
			});
			break;

		case "wwdc":
			clientManager.addActivity(`appledev-${type}`, {
				application_id: config.extensions.appledev.clientId,

				name: "WWDC 24",
				details: "Watching news for developers",
				state: "On Apple developer",

				assets: {
					small_image: config.extensions.appledev.assets.wwdc,
					small_text: "WWDC 24"
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`appledev-${type}`, true), keepAlive)
			});
			break;

		default:
			clientManager.addActivity(`appledev-${type}`, {
				application_id: config.extensions.appledev.clientId,

				name: "news",
				details: "Watching stuff for developers",
				state: "On Apple Developer",

				assets: {
					small_image: config.extensions.appledev.assets.app,
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
const DELETE = (extension, req, res) => {
	clientManager.removeActivity(`appledev-${req.body?.type ?? "unknow"}`);

	res.status(204).end();
};

module.exports = new Extension("Apple Developer", "/appledev", POST, DELETE, config.extensions.youtube.clientId, config.extensions.youtube.clientSecret);