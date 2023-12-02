const { ActivityType, Client, GatewayIntentBits } = require("discord.js");

module.exports = {
	client: new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] }),
	defaultActivity: {
		name: "Reading Wixonic's website",
		state: "wixonic.fr",
		type: ActivityType.Custom
	}
};