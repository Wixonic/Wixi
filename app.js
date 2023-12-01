const { ActivityType, Client, Collection, REST, Routes } = require("discord.js");
const { createAudioPlayer } = require("@discordjs/voice");
const fs = require("fs");
const path = require("path");

const config = require("./config.json");

const client = new Client({ intents: [] });
const player = createAudioPlayer();
const rest = new REST({ version: "10" }).setToken(config.discord.token);

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
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);

			if ("data" in command && "execute" in command) {
				client.commands.set(command.data.name, command);
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (command) {
			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(error);

				if (interaction.replied || interaction.deferred) await interaction.followUp({ content: "There was an error while executing this command.", ephemeral: true });
				else await interaction.reply({ content: "There was an error while executing this command.", ephemeral: true });
			}
		} else console.error(`No command matching ${interaction.commandName} was found.`);
	}
});

client.login(config.discord.token);