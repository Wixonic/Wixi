const { ApplicationCommandType } = require("discord.js");

const Command = require("../command");
const console = require("../console");

module.exports = new Command({
	name: "ping",
	description: "Sends a ping request to the bot.",
	type: ApplicationCommandType.ChatInput,

	log: () => console.log("Pong"),

	/**
	 * @param {ChatInputCommandInteraction} interaction
	 */
	run: async (interaction) => {
		await interaction.safeReply({
			content: "Pong!",
			ephemeral: true
		});
	}
});