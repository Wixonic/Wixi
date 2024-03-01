const { Client } = require("discord-rpc");

const log = require("./log");

/**
 * @property {Client} client
 * @property {string} name
 * @property {string} path
 * 
 * @property {function(import("express").Request, import("express").Response)} DELETE
 * @property {function(import("express").Request, import("express").Response)} POST
 */
class Extension {
	/**
	 * @param {string} clientId
	 * @param {string} clientSecret
	 * @param {string} name
	 * @param {string} path
	 * 
	 * @param {function(import("express").Request, import("express").Response)} POST
	 * @param {function(import("express").Request, import("express").Response)} DELETE
	 */
	constructor(name, path, POST, DELETE, clientId, clientSecret) {
		this.client = new Client({
			transport: "ipc"
		});

		this.client.on("ready", () => log(`${name} - Connected`));

		this.client.login({
			clientId,
			clientSecret
		}).catch((e) => log(`${name} - Failed to connect: ${e}`));

		this.name = name;
		this.path = path;

		this.DELETE = DELETE;
		this.POST = POST;
	};
};

module.exports = {
	Extension
};