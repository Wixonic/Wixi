const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("storage")
		.setDescription("Allows to share big files"),

	async execute(interaction) {

	}
};