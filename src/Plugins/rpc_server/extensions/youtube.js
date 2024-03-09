const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res, keepAlive) => {
	const type = req.body?.type ?? "unknow";

	switch (type) {
		case "home":
			clientManager.addActivity(`youtube-${type}`, {
				application_id: config.extensions.youtube.clientId,

				name: "YouTube homepage",
				details: "Looking for videos on the homepage",
				state: "On YouTube",

				assets: {
					small_image: config.extensions.youtube.assets.app,
					small_text: "Homepage"
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`youtube-${type}`, true), keepAlive)
			});
			break;

		case "subscriptions":
			clientManager.addActivity(`youtube-${type}`, {
				application_id: config.extensions.youtube.clientId,

				name: "YouTube subscriptions",
				details: "Looking for videos on the subscriptions page",
				state: "On YouTube",

				assets: {
					small_image: config.extensions.youtube.assets.app,
					small_text: "Subscriptions page"
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`youtube-${type}`, true), keepAlive)
			});
			break;

		case "video":
			clientManager.addActivity(`youtube-${type}`, {
				application_id: config.extensions.youtube.clientId,

				name: req.body?.name ?? "a video on YouTube",
				details: req.body?.name ?? "Details not available",
				state: req.body?.author ? `By ${req.body.author}` : "On YouTube",

				assets: {
					small_image: config.extensions.youtube.assets.app,
					small_text: req.body?.name
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`youtube-${type}`, true), keepAlive)
			});
			break;

		default:
			clientManager.addActivity(`youtube-${type}`, {
				application_id: config.extensions.youtube.clientId,

				name: "a video",
				details: "Details not available",
				state: `On YouTube${type == "mobile" ? " for iOS" : ""}`,

				assets: {
					small_image: config.extensions.youtube.assets.app,
					small_text: `YouTube${type == "mobile" ? " for iOS" : ""}`
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`youtube-${type}`, true), keepAlive)
			});
			break;
	};

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (extension, req, res) => {
	clientManager.removeActivity(`youtube-${req.body?.type ?? "unknow"}`);

	res.status(204).end();
};

module.exports = new Extension("YouTube", "/youtube", POST, DELETE, config.extensions.youtube.clientId, config.extensions.youtube.clientSecret);