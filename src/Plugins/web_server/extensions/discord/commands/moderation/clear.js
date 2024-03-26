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

	/**
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */

	async execute(interaction) {
		const count = interaction.options.getInteger("count") ?? 1;

		const channel = await interaction.channel.fetch(true);

		const messages = await channel.messages.fetch({
			deletable: true,
			limit: count
		});

		await new Promise((resolve) => {
			messages.each(async (message) => await message.delete());
			resolve();
		});

		await interaction.reply(`${count} message${count > 1 ? "s" : ""} deleted`);
	}
};