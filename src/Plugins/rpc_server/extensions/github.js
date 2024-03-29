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
		case "repository":
			const owner = req.body?.owner ?? "owner";
			const repo = req.body?.repository ?? "repository";

			clientManager.addActivity(`github-${type}`, {
				name: `${owner}/${repo}`,
				details: `Watching ${req.body?.details ?? "the repository"}`,
				state: "On GitHub",

				assets: {
					small_image: config.assets.logo_github,
					small_text: "GitHub"
				},

				buttons: [
					`Open ${owner}/${repo}`,
					"Open my profile"
				],
				metadata: {
					button_urls: [
						`https://github.com/${owner}/${repo}`,
						(await request({
							type: "headers",
							url: "https://go.wixonic.fr/github"
						}))["location"]
					]
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`github-${type}`, true), keepAlive)
			});
			break;

		case "profile":
			const profile = req.body?.profile ?? "someone";

			clientManager.addActivity(`github-${type}`, {
				name: `${profile}'${profile.endsWith("s") ? "" : "s"} profile`,
				details: `Watching ${req.body?.details ?? "the profile"}`,
				state: "On GitHub",

				assets: {
					small_image: config.assets.logo_github,
					small_text: "GitHub"
				},

				buttons: [
					`Open ${profile}'${profile.endsWith("s") ? "" : "s"} profile`,
					"Open my profile"
				],
				metadata: {
					button_urls: [
						`https://github.com/${profile}`,
						(await request({
							type: "headers",
							url: "https://go.wixonic.fr/github"
						}))["location"]
					]
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`github-${type}`, true), keepAlive)
			});
			break;

		default:
			clientManager.addActivity(`github-${type}`, {
				name: "repositories",
				details: "Details not available",
				state: `Currently on GitHub${type == "mobile" ? " for iOS" : ""}`,

				assets: {
					small_image: config.assets.logo_github,
					small_text: "GitHub"
				},

				buttons: [
					"Open my profile"
				],
				metadata: {
					button_urls: [
						(await request({
							type: "headers",
							url: "https://go.wixonic.fr/github"
						}))["location"]
					]
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`github-${type}`, true), keepAlive)
			});
			break;
	};

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (_, req, res) => {
	clientManager.removeActivity(`github-${req.body?.type ?? "unknow"}`);
	res.status(204).end();
};

module.exports = new Extension("GitHub", "/github", POST, DELETE, config.extensions.github.clientId, config.extensions.github.clientSecret);