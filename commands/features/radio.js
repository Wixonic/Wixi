const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("radio")
		.setDescription("Stuff about the radio")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("event")
				.setDescription("Lock the radio to an event channel")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("The event channel")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("lock")
				.setDescription("Lock the radio to a voice channel")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("The voice channel")
						.setRequired(true)
				)
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName("unlock")
				.setDescription("Unlock the radio when it was previously locked by /radio event or /radio lock")
		),

	async execute(interaction) {
		await interaction.reply("Pong!");
	}
};