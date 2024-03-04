const { Client } = require("discord.js-selfbot-v13");

const config = require("./config");
const log = require("./log");


class ClientManager {
	/**
	 * @type {Object<string, import("discord.js-selfbot-v13").ActivitiesOptions>}
	 */
	activities = {};

	/**
	 * @type {Client?}
	 */
	client = null;

	/**
	 * @param {string} name
	 * @param {import("discord.js-selfbot-v13").ActivitiesOptions} activity
	 */
	addActivity(name, activity) {
		this.activities[name] = activity;
		this.updateActivity();
	};

	/**
	 * @param {string} name
	 */
	removeActivity(name) {
		delete this.activities[name];
		this.updateActivity();
	};

	async updateActivity() {
		const activityList = Object.values(this.activities);

		while (!this.client.isReady()) await new Promise((resolve) => setTimeout(resolve, 1000));

		this.client.user.setPresence({
			activities: activityList,
			status: activityList.length > 0 ? "idle" : "invisible"
		});
	};

	constructor() {
		this.client = new Client({
			presence: {
				status: "invisible"
			}
		});

		this.client.on("ready", () => {
			log(`Client - Logged in as ${this.client.user?.username ?? "unknown"}`);
			this.updateActivity();
		});

		this.client.on("error", (error) => log(`Client - An error occured: ${error}`));

		this.client.login(config.token);

		process.on("SIGINT", async () => {
			this.client.destroy();
			log(`Client - Logged out`);
			process.exit();
		})
	};
};

module.exports = new ClientManager();