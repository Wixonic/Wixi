const { ApplicationCommandType, ChatInputCommandInteraction, SlashCommandStringOption } = require("discord.js");

const Command = require("../command");
const { ExtendedInteraction } = require("../command");
const console = require("../console");

module.exports = new Command({
	name: "echo",
	description: "Reply with the same message as provided.",
	type: ApplicationCommandType.ChatInput,

	options: [
		new SlashCommandStringOption()
			.setName("text")
			.setDescription("The text to echo")
			.setRequired(true)
	],

	log: (arguments) => console.log(arguments),

	/**
	 * @param {ChatInputCommandInteraction & ExtendedInteraction} interaction
	 */
	run: async (interaction) => {
		const text = interaction.options.getString("text", true);
		interaction.log(`echo ${text}`);

		await interaction.safeReply({
			content: text,
			ephemeral: true
		});
	}
});