const fs = require("fs");
const path = require("path");

const { client } = require("./client");
const { error, info, log, warn } = require("./console");
const { app, router } = require("./website");

const init = () => {
	const foldersPath = path.join(__dirname, "commands");
	const commandFolders = fs.readdirSync(foldersPath);

	let started = 0;
	let totalCommands = 0;

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

		totalCommands += commandFiles.length;

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);

			if ("data" in command && "execute" in command) {
				client.commands.set(command.data.name, command);
				if ("plugin" in command) command.plugin(app, router);

				log(`Command started at ./${path.relative(foldersPath, filePath)}`);
				started++;
			} else warn(`The command at ./${path.relative(foldersPath, filePath)} is missing a required "data" or "execute" property.`);
		}
	}

	info(`${started}/${totalCommands} commands started`);

	client.on("interactionCreate", async (interaction) => {
		if (interaction.isChatInputCommand()) {
			interaction.error = (text) => error(`${interaction.user.displayName} - ${text}`);
			interaction.log = (text) => log(`${interaction.user.displayName} - ${text}`);
			interaction.info = (text) => info(`${interaction.user.displayName} - ${text}`);
			interaction.warn = (text) => warn(`${interaction.user.displayName} - ${text}`);

			interaction.safeReply = async (reply) => {
				if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
				else await interaction.reply(reply);
			};

			const command = interaction.client.commands.get(interaction.commandName);

			if (command) {
				try {
					interaction.info(interaction.toString());
					await command.execute(interaction);
				} catch (e) {
					interaction.error(e);

					await interaction.safeReply({ content: "There was an error while executing this command.", ephemeral: true, allowedMentions: { repliedUser: false } });
				}
			} else {
				const e = `No command matching "${interaction.commandName}" was found.`;
				interaction.error(e);
				await interaction.safeReply({ content: e, ephemeral: true, allowedMentions: { repliedUser: false } });
			}
		}
	});

	info("Text-command interaction handler ready");
};

module.exports = {
	init
};