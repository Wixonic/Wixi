const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const config = require("./config");

const log = require("./log");

const commands = [];
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		if ("data" in command && "execute" in command) commands.push(command.data.toJSON());
		else log(`The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const rest = new REST().setToken(config.token);

(async () => {
	try {
		await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
	} catch (e) {
		log(e);
	} finally {
		process.exit(0);
	}
})();