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
		await interaction.reply({ content: "Pong!", ephemeral: true });
	}
};