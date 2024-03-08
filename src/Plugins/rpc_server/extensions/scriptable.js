const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res, keepAlive) => {
	clientManager.addActivity("scriptable", {
		application_id: config.extensions.scriptable.clientId,

		name: "Scriptable",
		state: "Working on scripts",

		assets: {
			small_image: config.extensions.scriptable.assets.app,
			small_text: "Scriptable"
		},

		timestamps: {
			start: Date.now()
		},

		type: 0, // PLAYING

		keepAliveId: keepAlive == null ? null : setTimeout(() => clientManager.removeActivity("scriptable", true), keepAlive)
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (extension, req, res) => {
	clientManager.removeActivity("scriptable");

	res.status(204).end();
};

module.exports = new Extension("Scriptable", "/scriptable", POST, DELETE, config.extensions.scriptable.clientId, config.extensions.scriptable.clientSecret);