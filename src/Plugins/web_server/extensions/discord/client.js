const { ActivityType, Client, GatewayIntentBits, Partials } = require("discord.js");

const config = require("./config");
const settings = require("./settings");

const client = new Client({
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates
	],
	partials: [
		Partials.Channel
	]
});

client.login(config.token);

module.exports = {
	client,
	defaultActivity: {
		name: "Sleeping",
		state: "server.wixonic.fr/discord",
		type: ActivityType.Custom
	},
	guild() {
		return client.guilds.cache.get(settings.guild);
	}
};