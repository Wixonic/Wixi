const { Router } = require("express");
const { } = require("socket.io");

/**
 * Plugin manager
 */
class Plugin {
	/**
	 * List of all plugins
	 * @type {Array<Plugin>}
	 */
	static list = [];

	/**
	 * Creates a plugin
	 * @param {Router} router
	 * @param {} socket
	 */
	constructor(router, socket) {

	};
};

module.exports = Plugin;