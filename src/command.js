const { ApplicationCommandType, BaseInteraction } = require("discord.js");
const fs = require("fs");
const path = require("path");

const console = require("./console");
const REST = require("./rest");

const config = require("./config");
const settings = require("./settings");

/**
 * @typedef {Object} CommandOptions
 * @property {string} name
 * @property {string} description
 * @property {0|ApplicationCommandType} type
 * @property {CommandOptionsLog} log
 * @property {CommandOptionsRun?} run
 * 
 * @callback CommandOptionsLog
 * @param {Array<string>?} args
 * @returns {void}
 * 
 * @callback CommandOptionsRun
 * @param {BaseInteraction} interaction
 * @returns {void}
 */

/**
 * Command manager
 */
class Command {
	/**
	 * List of all commands
	 * @type {Array<Command>}
	 */
	static list = [];

	/**
	 * Gets a command by its name and its type
	 * @param {string} name
	 * @param {ApplicationCommandType|0|Array<ApplicationCommandType|0>?} type
	 * @returns {Command?} A command if found, otherwise null
	 */
	static get(name, type) {
		for (const command of this.list) {
			if (command.name == name) {
				if (type == null) return command;
				else if (type instanceof Array) if (type.includes(command.type)) return command;
				else if (command.type == type) return command;
			}
		}

		return null;
	};

	/**
	 * Registers all commands in the local list to Discord
	 */
	static register() {
		const list = this.list.filter((command) => command.type != 0);

		for (const command of this.list) {
			/* REST.post(`/applications/${config.discord.applicationId}/commands`, {
				
			}); */
		}
	};

	/**
	 * Updates the local list of commands
	 */
	static update() {
		this.list = [];

		if (fs.existsSync(settings.commands.path)) {
			const commandFileNames = fs.readdirSync(settings.commands.path, {
				recursive: true
			});

			let loaded = 0;

			for (const commandFileName of commandFileNames) {
				const commandPath = "./" + path.join(settings.commands.path, commandFileName);

				delete require.cache[require.resolve(commandPath)];

				try {
					require(commandPath);
					console.log(`Loaded command "${commandFileName}"`);
					loaded++;
				} catch (e) {
					console.error(`Failed to load "${commandFileName}": ${e.message}`);
				}
			}

			console.info(`Loaded ${loaded}/${commandFileNames.length} command${loaded > 1 ? "s" : ""}`);
		}
	};

	/**
	 * Creates a command
	 * @param {CommandOptions} options
	 */
	constructor(options) {
		if (!options) console.error("Options are required to create a command.");

		this.name = options.name;
		this.description = options.description;
		this.type = options.type;
		this.log = options.log;

		/**
		 * @type {CommandOptionsRun}
		 */
		this.run = options.run ?? (async (interaction) => {
			console.error("This command is a console-only command.");

			await interaction.safeReply({
				content: "Wait.. You can't do that!",
				ephemeral: true
			});
		});

		Command.list.push(this);
	};
};

console.input.on("submit", () => {
	const value = console.input.value;

	console.input.focus();
	console.input.clearValue("");

	console.write(`> ${value}`, `[INP] - ${value}`);

	const args = [];

	let isString = false;
	let arg = "";

	for (let x = 0; x < value.length; ++x) {
		if (value[x] === " " && !isString) {
			args.push(arg);
			arg = "";
		} else if (value[x] === "\"") {
			if (value[x - 1] !== "\\") {
				isString = !isString;
			} else {
				arg = arg.substring(0, arg.length - 1);
				arg += "\"";
			}
		} else {
			arg += value[x];
		}
	}

	args.push(arg);

	for (const arg of args) {
		if (arg.length == 0) delete arg;
	}

	const name = args.shift();

	const command = Command.get(name, [0, ApplicationCommandType.ChatInput]);
	if (command) command.log(args);
	else console.error(`Command "${name}" does not exist.`);
});

module.exports = Command;