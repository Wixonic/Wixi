const { Client, GatewayIntentBits, PresenceUpdateStatus } = require("discord.js");

const console = require("./console");

const config = require("./config");

/**
 * Client manager
 */
class ClientManager extends Client {
	/**
	 * Creates a Client manager
	 * @param {CommandOptions} options
	 */
	constructor() {
		super({
			allowedMentions: {
				parse: [],
				repliedUser: false,
				roles: [],
				users: []
			},
			closeTimeout: 5000,
			failIfNotExists: true,
			intents: [
				GatewayIntentBits.AutoModerationConfiguration,
				GatewayIntentBits.AutoModerationExecution,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildEmojisAndStickers,
				GatewayIntentBits.GuildIntegrations,
				GatewayIntentBits.GuildInvites,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildMessageReactions,
				GatewayIntentBits.GuildMessageTyping,
				GatewayIntentBits.GuildModeration,
				GatewayIntentBits.GuildPresences,
				GatewayIntentBits.GuildScheduledEvents,
				GatewayIntentBits.GuildVoiceStates,
				GatewayIntentBits.GuildWebhooks,
				GatewayIntentBits.MessageContent
			],
			presence: {
				status: PresenceUpdateStatus.Idle
			}
		});

		this.login(config.discord.token);
	};
};

const client = new ClientManager();
client.on("ready", () => console.info(`${client.user.username} is online.`));

module.exports = client;