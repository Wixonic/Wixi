const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("storage")
		.setDescription("Share big files on Discord")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("upload")
				.setDescription("Upload a big file"))
		.addSubcommand((subcommand) =>
			subcommand
				.setName("download")
				.setDescription("Download a big file")
				.addStringOption((option) =>
					option
						.setName("upload-id")
						.setDescription("The upload ID of the file")
						.setRequired(true)
				)
		),

	async execute(interaction) {
		await interaction.reply({
			content: "This feature doesn't work for now",
			ephemeral: true,
			allowedMentions: {
				repliedUser: false
			}
		});
	}
};