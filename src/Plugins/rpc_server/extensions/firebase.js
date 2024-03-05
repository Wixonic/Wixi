const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");

/**
 * @type {import("../extension").ExtensionPOST}
 */
const POST = async (extension, req, res) => {
	clientManager.addActivity(`firebase-safari-${req.body?.mobile ? "mobile" : "desktop"}`, {
		application_id: config.extensions.firebase.clientId,

		name: "a project on Firebase",
		details: "Unknown details",
		state: `Currently on Firebase${req.body?.mobile ? " on iOS" : ""}`,

		assets: {
			small_image: config.extensions.firebase.assets.app,
			small_text: `Firebase on Safari${req.body?.mobile ? " for iOS" : ""}`
		},

		type: "WATCHING"
	});

	res.status(204).end();
};

/**
 * @type {import("../extension").ExtensionDELETE}
 */
const DELETE = (extension, req, res) => {
	clientManager.removeActivity(`firebase-safari-${req.body?.mobile ? "mobile" : "desktop"}`);

	res.status(204).end();
};

module.exports = new Extension("Firebase", "/safari/firebase", POST, DELETE, config.extensions.firebase.clientId, config.extensions.firebase.clientSecret);