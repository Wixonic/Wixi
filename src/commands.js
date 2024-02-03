const { ChannelType, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const { AI } = require("./ai");
const { client } = require("./client");
const { error, info, warn } = require("./console");
const { User } = require("./user");

const settings = require("./settings");

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

	client.on("messageCreate", async (message) => {
		const threadId = `${message.author.id}-${Date.now().toString(36)}`;

		if (message.channel.partial) await message.channel.fetch();

		if (!message.author.bot && (message.channel.type == ChannelType.DM || message.channel.type == ChannelType.GroupDM)) {
			await message.channel.sendTyping();

			const prompt = message.content;
			const user = await User.fromFile(message.author.id);

			if (user) {
				if (settings.ai.enabled) {
					info(`${threadId} | Prompt - ${prompt}`);

					try {
						let answer = `${await AI.answer(message.author, prompt)}

> Provided by WixAI; Wixi can make mistakes, consider checking important information
> Generated in ${((Date.now() - message.createdTimestamp) / 1000).toFixed(1)} seconds`;

						if (answer.length > 2000) answer = answer.slice(0, 2000 - 19) + "[Message truncated]";

						info(`${threadId} | Answer - ${answer}`);

						await message.reply({
							content: answer,

							allowedMentions: {
								repliedUser: false
							}
						});
					} catch (e) {
						error(`${threadId} | Failed to answer in DMs: ${e}`);
						await message.reply({
							content: "Wow, my brain is overheating! I can't answer, sorry... Try to ask me again in a minute",

							allowedMentions: {
								repliedUser: false
							}
						});
					}
				} else {
					await message.reply({
						content: "Hey! My brain has been disabled for some reason... Come back later!",
						allowedMentions: {
							repliedUser: false
						}
					});
				}
			} else {
				warn(`${threadId} | Unauthorized`);
				await message.reply({
					content: "Hey! Make sure your account is verified.\nIf you need help, create a ticket [here](<https://discord.com/channels/1020663521530351627/1037855849944731808>).",
					components: [
						{
							type: 1,
							components: [
								{
									type: 2,
									label: `Verify your account`,
									url: settings.rules.url,
									style: 5
								}
							]
						}
					],
					allowedMentions: {
						repliedUser: false
					}
				});
			}
		}
	});
};

module.exports = {
	init
};