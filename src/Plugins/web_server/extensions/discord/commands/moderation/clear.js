const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("clear")
		.setDescription("Clear messages in chat newer than two weeks")
		.addIntegerOption((option) =>
			option
				.setName("count")
				.setDescription("Number of messages to delete, default to maximum")
				.setMinValue(1)
				.setMaxValue(95)
		),

	/**
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */

	async execute(interaction) {
		const count = interaction.options.getInteger("count") ?? 95;

		const channel = await interaction.channel.fetch(true);

		const messages = (await channel.messages.fetch({
			deletable: true,
			limit: count
		})).filter((message) => message.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000 > Date.now());

		await channel.bulkDelete(messages);

		await interaction.reply(`${messages.size} message${messages.size > 1 ? "s" : ""} deleted`);
	}
};