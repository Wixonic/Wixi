/**
 * @typedef {function(Extension, import("express").Request, import("express").Response, number | null)} ExtensionPOST
 */

/**
 * @typedef {function(Extension, import("express").Request, import("express").Response)} ExtensionDELETE
 */

/**
 * @property {string} name
 * @property {string} path
 * 
 * @property {ExtensionPOST} POST
 * @property {ExtensionDELETE} DELETE
 */
class Extension {
	/**
	 * @param {string} name
	 * @param {string} path
	 * 
	 * @param {ExtensionPOST?} POST
	 * @param {ExtensionDELETE?} DELETE
	 */
	constructor(name, path, POST, DELETE) {
		this.name = name;
		this.path = path;

		this.DELETE = DELETE;
		this.POST = POST;
	};
};

module.exports = {
	Extension
};