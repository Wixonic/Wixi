const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res, keepAlive) => {
	const type = req.body?.type ?? "unknow";

	switch (type) {
		case "repository":
			const owner = req.body?.owner ?? "owner";
			const repo = req.body?.repository ?? "repository";

			clientManager.addActivity(`github-${type}`, {
				application_id: config.extensions.github.clientId,

				name: `${owner}/${repo}`,
				details: `Watching ${req.body?.details ?? "the repository"}`,
				state: "On GitHub",

				assets: {
					small_image: config.extensions.github.assets.app,
					small_text: "GitHub"
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`github-${type}`, true), keepAlive)
			});
			break;

		case "profile":
			const profile = req.body?.profile ?? "someone";

			clientManager.addActivity(`github-${type}`, {
				application_id: config.extensions.github.clientId,

				name: `${profile}'${profile.endsWith("s") ? "" : "s"} profile`,
				details: `Watching ${req.body?.details ?? "the profile"}`,
				state: "On GitHub",

				assets: {
					small_image: config.extensions.github.assets.app,
					small_text: "GitHub"
				},

				type: 3, // WATCHING

				keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity(`github-${type}`, true), keepAlive)
			});
			break;

		default:
			clientManager.addActivity(`github-${type}`, {
				application_id: config.extensions.github.clientId,

				name: "repositories",
				details: "Details not available",
				state: `Currently on GitHub${type == "mobile" ? " for iOS" : ""}`,

				assets: {
					small_image: config.extensions.github.assets.app,
					small_text: `GitHub${type == "mobile" ? " for iOS" : ""}`
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
const DELETE = (extension, req, res) => {
	clientManager.removeActivity(`github-${req.body?.type ?? "unknow"}`);
	res.status(204).end();
};

module.exports = new Extension("GitHub", "/github", POST, DELETE, config.extensions.github.clientId, config.extensions.github.clientSecret);