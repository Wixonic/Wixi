const { REST, Routes } = require("discord.js");

const config = require("./config");

/**
 * REST manager
 */
class RESTManager extends REST {
	/**
	 * Create a REST manager
	 */
	constructor() {
		super({ version: "10" });
		this.setToken(config.discord.token);
	};
};

module.exports = new RESTManager();