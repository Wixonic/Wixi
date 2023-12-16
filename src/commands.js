const fs = require("fs");
const path = require("path");

const { client } = require("./client");
const { error } = require("./console");

const init = () => {
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

	client.on("interactionCreate", async (interaction) => {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (command) {
				try {
					interaction.userLog = `${interaction.user.username} - `;
					await command.execute(interaction);
				} catch (e) {
					error(e);

					if (interaction.replied || interaction.deferred) await interaction.followUp({ content: "There was an error while executing this command.", ephemeral: true });
					else await interaction.reply({ content: "There was an error while executing this command.", ephemeral: true });
				}
			} else error(`No command matching ${interaction.commandName} was found.`);
		}
	});
};

module.exports = {
	init
};