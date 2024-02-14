const { ApplicationCommandType, PresenceUpdateStatus } = require("discord.js");

const client = require("./client");
const Command = require("./command");
const console = require("./console");
const stats = require("./stats");

Command.update();
Command.deploy();

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