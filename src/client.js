const { ActivityType, Client, GatewayIntentBits } = require("discord.js");

const config = require("./config");
const settings = require("./settings");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates
	]
});

client.login(config.discord.token);

module.exports = {
	client,
	defaultActivity: {
		name: "Sleeping",
		state: "discord.wixonic.fr",
		type: ActivityType.Custom
	},
	guild() {
		return client.guilds.cache.get(settings.guild);
	}
};