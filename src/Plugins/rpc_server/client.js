const { Client } = require("discord.js-selfbot-v13");
const fs = require("fs");

const { BaseObject } = require("./base");
const request = require("./request");
const { clone } = require("./utils");

const config = require("./config");
const path = require("path");

/**
 * @typedef {(import("discord.js-selfbot-v13").ActivitiesOptions | import("discord.js-selfbot-v13").RichPresence | import("discord.js-selfbot-v13").SpotifyRPC | import("discord.js-selfbot-v13").CustomStatus)} Activity
 */

class ClientManager extends BaseObject {
	/**
	 * @type {Object<string, Activity>}
	 */
	activities = {};

	/**
	 * @type {Object<string, CachedAsset>}
	 */
	assetsCache = {};

	/**
	 * @type {Client?}
	 */
	client = null;

	/**
	 * @param {string} id
	 * @param {Activity} activity
	 */
	addActivity(id, activity) {
		clearTimeout(this.activities[id]?.keepAliveId);

		if (this.activities[id] != activity) {
			this.activities[id] = activity;
			this.updateActivity();
		}
	};

	/**
	 * @param {string} id
	 * @param {boolean?} fromKeepAlive
	 */
	removeActivity(id, fromKeepAlive = false) {
		clearTimeout(this.activities[id]?.keepAliveId);

		delete this.activities[id];
		this.updateActivity();
		if (fromKeepAlive) this.log(`${id} deleted by Keep-Alive`);
	};

	async updateActivity() {
		/**
		 * @type {Activity[]}
		 */
		const activities = Object.values(clone(this.activities));

		while (!this.client.isReady()) await new Promise((resolve) => setTimeout(resolve, 1000));

		for (const activity of activities) {
			activity.application_id = config.applicationId;
			delete activity.keepAliveId;
		}

		this.client.user.setPresence({
			activities,
			afk: true,
			status: Object.values(this.activities).length > 0 ? "idle" : "invisible"
		});
	};

	constructor() {
		super();

		this.client = new Client({
			presence: {
				afk: true,
				status: "idle"
			}
		});

		this.client.on("ready", () => {
			this.log(`Logged in as ${this.client.user?.username ?? "unknown"}`);
			this.updateActivity();
		});

		this.client.on("error", (error) => this.log(`An error occured: ${error}`));

		this.client.login(config.token);

		process.on("SIGINT", async () => {
			this.client.destroy();
			this.log(`Logged out`);
			process.exit(0);
		});
	};
};

module.exports = new ClientManager();