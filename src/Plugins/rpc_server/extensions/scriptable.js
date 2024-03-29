const clientManager = require("../client");
const { Extension } = require("../extension");

const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (_, _2, res, keepAlive) => {
	clientManager.addActivity("scriptable", {
		name: "Scriptable",
		state: "Working on scripts",

		assets: {
			small_image: config.assets.logo_scriptable,
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
const DELETE = (_, _2, res) => {
	clientManager.removeActivity("scriptable");

	res.status(204).end();
};

module.exports = new Extension("Scriptable", "/scriptable", POST, DELETE);