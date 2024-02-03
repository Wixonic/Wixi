const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

const settings = require("../../settings");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("beta-storage")
		.setDescription("[BETA] Share big files on Discord")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("upload")
				.setDescription("[BETA] Upload a big file"))
		.addSubcommand((subcommand) =>
			subcommand
				.setName("download")
				.setDescription("[BETA] Download a big file")
				.addStringOption((option) =>
					option
						.setName("upload-id")
						.setDescription("The upload ID of the file")
						.setRequired(true)
				)
		),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case "download":
				await interaction.safeReply({
					content: `Uh. Not sure I can do that right now...`,
					ephemeral: true,
					allowedMentions: {
						repliedUser: false
					}
				});
				break;

			case "upload":
				const rootStats = fs.statfsSync("/");
				const available = rootStats.bfree * rootStats.bsize - settings.storage.needed * (10 ** 9);

				if (!settings.storage.limit || available > 0) {
					console.log(available);
				} else {
					console.log("Not enough space");
				}
				break;

			default:
				const e = `No subcommand matching "/${interaction.commandName} ${subcommand}" was found.`;
				interaction.error(e);

				await interaction.safeReply({
					content: e,
					ephemeral: true,
					allowedMentions: {
						repliedUser: false
					}
				});
				break;
		}
	}
};