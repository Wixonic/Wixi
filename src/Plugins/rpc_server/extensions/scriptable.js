const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res) => {
	clientManager.addActivity("scriptable", {
		application_id: config.extensions.scriptable.clientId,

		name: "scripts",
		details: "Details not available",
		state: "Working on scripts",

		assets: {
			small_image: config.extensions.scriptable.assets.app,
			small_text: "Scriptable"
		},

		type: "WATCHING"
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