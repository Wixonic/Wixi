const { ActivityType, Client, Collection, REST, Routes } = require("discord.js");
const { createAudioPlayer } = require("@discordjs/voice");
const fs = require("fs");
const path = require("path");

const config = require("./config.json");
const { error, info, log, warn } = require("./console.js");

const client = new Client({ intents: [] });
const player = createAudioPlayer();

client.commands = new Collection();

client.once("ready", () => {
	client.user.setActivity({
		name: "Reading Wixonic's website",
		state: "wixonic.fr",
		type: ActivityType.Custom
	});

	const foldersPath = path.join(__dirname, "commands");
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);

			if ("data" in command && "execute" in command) client.commands.set(command.data.name, command);
			else warn(`The command at ${filePath} is missing a required "data" or "execute" property.`)
		}
	}

	info(client.user.displayName + " ready");
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (command) {
			try {
				await command.execute(interaction);
				log(`${interaction.user.username} executed ${interaction.commandName}`);
			} catch (e) {
				error(e);

				if (interaction.replied || interaction.deferred) await interaction.followUp({ content: "There was an error while executing this command.", ephemeral: true });
				else await interaction.reply({ content: "There was an error while executing this command.", ephemeral: true });
			}
		} else error(`No command matching ${interaction.commandName} was found.`);
	}
});

client.login(config.discord.token);