const { ApplicationCommandType, Interaction } = require("discord.js");

const console = require("./console");
const REST = require("./rest");

const config = require("./config");

/**
 * @typedef {Object} CommandOptions
 * @property {string} name
 * @property {string} description
 * @property {ApplicationCommandType} type
 * @property {function(): text} log
 * @property {function(Interaction): void} run
 */

/**
 * Command manager
 * @class
 */
class Command {
	/**
	 * List of all commands
	 * @type {Array<Command>}
	 */
	static list = [];

	/**
	 * Get a command by its name
	 * @param {string} name
	 * @returns {Command|null} - A command if found, otherwise null
	 */
	static get(name) {
		for (const command of this.list) {
			if (command.name == name) return command;
		}

		return null;
	};

	/**
	 * Register all commands to Discord
	 */
	static register() {
		for (const command of this.list) {
			REST.post(`/applications/${config.discord.applicationId}/commands`, {

			});
		}
	};

	/**
	 * Create a command
	 * @param {CommandOptions} options
	 */
	constructor(options) {
		if (!options) console.error("Options are required to create a command.");

		/**
		 * @type {string}
		 */
		this.name = options.name;

		/**
		 * @type {string}
		 */
		this.description = options.description;

		/**
		 * @type {ApplicationCommandType}
		 */
		this.type = options.type;

		/**
		 * @type {function(): text}
		 */
		this.log = options.log;

		/**
		 * @type {function(Interaction): void}
		 */
		this.run = options.run;
	};
};

module.exports = Command;