const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("clear")
		.setDescription("Clear messages in chat")
		.addIntegerOption((option) =>
			option
				.setName("count")
				.setDescription("Number of messages to delete, leave empty for all")
				.setMinValue(1)
		),

	async execute(interaction) {
		interaction.warn("This feature doesn't work for now");

		await interaction.safeReply({
			content: "This feature doesn't work for now",
			ephemeral: true,
			allowedMentions: {
				repliedUser: false
			}
		});
	}
};