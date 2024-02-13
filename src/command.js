const { ApplicationCommandType, BaseInteraction, MessagePayload, MessageReplyOptions, PresenceUpdateStatus, Routes, SlashCommandAttachmentOption, SlashCommandBooleanOption, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandOptionsOnlyBuilder, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandsOnlyBuilder, SlashCommandUserOption } = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = require("./client");
const console = require("./console");
const REST = require("./rest");

const config = require("./config");
const settings = require("./settings");
const stats = require("./stats");

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

console.input.on("submit", () => {
	const value = console.input.value;

	console.input.focus();
	console.input.clearValue("");

	console.write(`> ${value} `, `[INP] - ${value} `);

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
	else console.error(`Command /${name} does not exist.`);
});

client.on("interactionCreate", async (interaction) => {
	stats.interactionCount++;

	if (stats.currentProcessingInteractionCount == 0) client.user.setStatus(PresenceUpdateStatus.Online);
	stats.currentProcessingInteractionCount++;

	interaction.error = (text) => console.error(`${interaction.user.username} - ${text} `);
	interaction.info = (text) => console.info(`${interaction.user.username} - ${text} `);
	interaction.log = (text) => console.log(`${interaction.user.username} - ${text} `);
	interaction.warn = (text) => console.warn(`${interaction.user.username} - ${text} `);
	interaction.write = (text) => console.write(`${interaction.user.username} - ${text} `);

	interaction.safeReply = async (options) => {
		if (interaction.deferred || interaction.replied) interaction.editReply(options);
		else interaction.reply(options);
	};

	try {
		await interaction.deferReply();

		const command = Command.get(interaction.commandName, interaction.commandType);

		if (command) {
			interaction.log(interaction.message ?? interaction.commandName);
			await command.run(interaction);
		} else {
			interaction.warn(`${interaction.message ?? interaction.commandName} - Not found`);
			await interaction.safeReply({
				content: "This command doesn't exist.",
				ephemeral: true
			});
		}
	} catch (e) {
		interaction.error(`${interaction.message ?? interaction.commandName} - ${e.message}`);

		await interaction.safeReply({
			content: `An error occured.\n\nError ID: \`${console.timestamp}\``,
			ephemeral: true
		});
	}

	stats.currentProcessingInteractionCount--;
	if (stats.currentProcessingInteractionCount == 0) client.user.setStatus(PresenceUpdateStatus.Idle);
});

module.exports = Command;