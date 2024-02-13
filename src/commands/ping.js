const { ApplicationCommandType, ChatInputCommandInteraction } = require("discord.js");

const Command = require("../command");
const { ExtendedInteraction } = require("../command");
const console = require("../console");

module.exports = new Command({
	name: "ping",
	description: "Sends a ping request to the bot.",
	type: ApplicationCommandType.ChatInput,

	log: () => console.log("Pong"),

	/**
	 * @param {ChatInputCommandInteraction & ExtendedInteraction} interaction
	 */
	run: async (interaction) => {
		await interaction.safeReply({
			content: "Pong!",
			ephemeral: true
		});
	}
});