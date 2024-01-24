const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ai")
		.setDescription("Generate stuff with WixAI"),

	async execute(interaction) {
		await interaction.reply({
			content: "Hey! Send me a message in DMs!",
			ephemeral: true,
			allowedMentions: {
				repliedUser: false
			}
		});
	}
};