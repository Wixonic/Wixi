const clientManager = require("../client");
const { Extension } = require("../extension");
const request = require("../request");

const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (_, req, res, keepAlive) => {
	const type = req.body?.type ?? "unknow";

	switch (type) {
		case "home":
			clientManager.addActivity(`youtube-${type}`, {
				name: "YouTube homepage",
				details: "Looking for videos on the homepage",
				state: "On YouTube",

				assets: {
					small_image: config.assets.logo_youtube,
					small_text: "Homepage"
				},

				buttons: [
					"Open my channel"
				],
				metadata: {
					button_urls: [
						(await request({
							type: "headers",
							url: "https://go.wixonic.fr/youtube"
						}))["location"]
					]
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`youtube-${type}`, true), keepAlive)
			});
			break;

		case "subscriptions":
			clientManager.addActivity(`youtube-${type}`, {
				name: "YouTube subscriptions",
				details: "Looking for videos on the subscriptions page",
				state: "On YouTube",

				assets: {
					small_image: config.assets.logo_youtube,
					small_text: "Subscriptions page"
				},

				buttons: [
					"Open my channel"
				],
				metadata: {
					button_urls: [
						(await request({
							type: "headers",
							url: "https://go.wixonic.fr/youtube"
						}))["location"]
					]
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`youtube-${type}`, true), keepAlive)
			});
			break;

		case "video":
			clientManager.addActivity(`youtube-${type}`, {
				name: req.body?.name ?? "a video on YouTube",
				details: req.body?.name ?? "Details not available",
				state: req.body?.author ? `By ${req.body.author}` : "On YouTube",

				assets: {
					small_image: config.assets.logo_youtube,
					small_text: req.body?.name
				},

				buttons: [
					"Watch the video",
					"Open my channel"
				],
				metadata: {
					button_urls: [
						req.body?.url,
						(await request({
							type: "headers",
							url: "https://go.wixonic.fr/youtube"
						}))["location"]
					]
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`youtube-${type}`, true), keepAlive)
			});
			break;

		default:
			clientManager.addActivity(`youtube-${type}`, {
				name: "a video",
				details: "Details not available",
				state: `On YouTube${type == "mobile" ? " for iOS" : ""}`,

				assets: {
					small_image: config.assets.logo_youtube,
					small_text: `YouTube${type == "mobile" ? " for iOS" : ""}`
				},

				buttons: [
					"Open my channel"
				],
				metadata: {
					button_urls: [
						(await request({
							type: "headers",
							url: "https://go.wixonic.fr/youtube"
						}))["location"]
					]
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
const DELETE = (_, req, res) => {
	clientManager.removeActivity(`youtube-${req.body?.type ?? "unknow"}`);

	res.status(204).end();
};

module.exports = new Extension("YouTube", "/youtube", POST, DELETE);