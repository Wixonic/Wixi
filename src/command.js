const { ApplicationCommandType, MessagePayload, MessageReplyOptions, Routes, SlashCommandAttachmentOption, SlashCommandBooleanOption, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandOptionsOnlyBuilder, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandsOnlyBuilder, SlashCommandUserOption } = require("discord.js");
const fs = require("fs");
const path = require("path");

const console = require("./console");
const REST = require("./rest");

const config = require("./config");
const settings = require("./settings");

/**
 * @typedef {Object} CommandOptions
 * @property {(SlashCommandAttachmentOption | SlashCommandBooleanOption | SlashCommandChannelOption | SlashCommandIntegerOption | SlashCommandMentionableOption | SlashCommandNumberOption | SlashCommandOptionsOnlyBuilder | SlashCommandRoleOption | SlashCommandStringOption | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandUserOption)[]?} options Only if the command is `ApplicationCommandType.ChatInput`
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
 * @param {ExtendedInteraction} interaction
 * @returns {Promise<void>}
 */

/**
 * @typedef {Object} ExtendedInteraction
 * @property {ExtendedInteractionSafeReply} safeReply
 * @property {ExtendedInteractionError} error
 * @property {ExtendedInteractionInfo} info
 * @property {ExtendedInteractionLog} log
 * @property {ExtendedInteractionWarn} warn
 * @property {ExtendedInteractionWrite} write
 * 
 * @callback ExtendedInteractionSafeReply
 * @param {string | MessagePayload | MessageReplyOptions} payload
 * @returns {Promise<void>}
 * 
 * @callback ExtendedInteractionError
 * @param {string} error
 * @returns {void}
 * 
 * @callback ExtendedInteractionInfo
 * @param {string} info
 * @returns {void}
 * 
 * @callback ExtendedInteractionLog
 * @param {string} text
 * @returns {void}
 * 
 * @callback ExtendedInteractionWarn
 * @param {string} warn
 * @returns {void}
 * 
 * @callback ExtendedInteractionWrite
 * @param {string} text
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
	 * @param {ApplicationCommandType | 0 | Array<ApplicationCommandType | 0>?} type
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
	static async deploy() {
		const list = this.list.filter((command) => command.type != 0);

		const APIList = [];
		for (const command of list) APIList.push({
			name: command.name,
			description: command.description,
			type: command.type,

			options: command.options
		});
		await REST.put(Routes.applicationCommands(config.discord.applicationId), { body: APIList });
		console.info(`${APIList.length} command${APIList.length > 1 ? "s" : ""} registered`);
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
	 * @param {CommandOptions} commandOptions
	 */
	constructor(commandOptions) {
		if (!commandOptions) console.error("Settings are required to create a command.");

		this.name = commandOptions.name;
		this.description = commandOptions.description;
		this.type = commandOptions.type;
		this.log = commandOptions.log;

		if (this.type == ApplicationCommandType.ChatInput) this.options = commandOptions.options ?? [];

		/**
		 * @type {CommandOptionsRun}
		 */
		this.run = commandOptions.run ?? (async (interaction) => {
			console.error("This command is a console-only command.");

			await interaction.safeReply({
				content: "Wait.. You can't do that!",
				ephemeral: true
			});
		});

		Command.list.push(this);
	};
};

module.exports = Command;