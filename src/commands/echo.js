const { ApplicationCommandType, ChatInputCommandInteraction } = require("discord.js");

const Command = require("../command");
const console = require("../console");

module.exports = new Command({
	name: "echo",
	description: "Reply with the same message as provided.",
	type: ApplicationCommandType.ChatInput,

	log: (arguments) => console.log(arguments),

	/**
	 * @param {ChatInputCommandInteraction} interaction
	 */
	run: async (interaction) => {
		await interaction.safeReply({
			content: interaction.options.getString("message", true),
			ephemeral: true
		});
	}
});