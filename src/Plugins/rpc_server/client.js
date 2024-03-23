const { Client } = require("discord.js-selfbot-v13");

const config = require("./config");
const log = require("./log");
const { clone } = require("./utils");

/**
 * @typedef {Object} ActivityAssets
 * @property {string?} large_image
 * @property {string?} large_text
 * @property {string?} small_image
 * @property {string?} small_text
 * 
 * @typedef {Object} ActivityButton
 * @property {string} label
 * @property {string} url
 * 
 * @typedef {Object} ActivityParty
 * @property {string?} id
 * @property {number[]?} size
 * 
 * @typedef {Object} ActivitySecrets
 * @property {string?} joins
 * 
 * @typedef {Object} ActivityTimestamps
 * @property {number?} start
 * @property {number?} end
 * 
 * 
 * @typedef {Object} BaseActivity
 * @property {string} application_id
 * @property {0 | 1 | 2 | 3 | 4 | 5} type
 * @property {string} name
 * @property {NodeJS.Timeout?} keepAliveId
 * 
 * 
 * @typedef {BaseActivity & {
 *   type: 0,
 *   assets: ActivityAssets?,
 *   details: string?,
 *   party: ActivityParty?,
 *   state: string?,
 *   secrets: ActivitySecrets?,
 *   timestamps: ActivityTimestamps?
 * }} PlayingActivity
 * 
 * @typedef {BaseActivity & {
 *   type: 1,
 *   assets: ActivityAssets?,
 *   details: string?,
 *   party: ActivityParty?,
 *   state: string?,
 *   url: string?
 * }} StreamingActivity
 * 
 * @typedef {BaseActivity & {
 *   type: 2,
 *   assets: ActivityAssets?,
 *   details: string?,
 *   party: ActivityParty?,
 *   state: string?
 * }} ListeningActivity
 * 
 * @typedef {BaseActivity & {
 *   type: 3,
 *   assets: ActivityAssets?,
 *   details: string?,
 *   party: ActivityParty?,
 *   state: string?
 * }} WatchingActivity
 * 
 * @typedef {BaseActivity & {
 *   type: 4,
 *   state: string?
 * }} CustomActivity
 * 
 * @typedef {BaseActivity & {
 *   type: 5,
 *   assets: ActivityAssets?,
 *   details: string?,
 *   party: ActivityParty?,
 *   state: string?
 * }} CompetingActivity
 * 
 * 
 * @typedef {PlayingActivity | StreamingActivity | ListeningActivity | WatchingActivity | CustomActivity | CompetingActivity} Activity
 */


class ClientManager {
	/**
	 * @type {Object<string, Activity>}
	 */
	activities = {};

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
		if (fromKeepAlive) log(`${id} deleted by Keep-Alive`);
	};

	async updateActivity() {
		const activityList = Object.values(clone(this.activities));

		while (!this.client.isReady()) await new Promise((resolve) => setTimeout(resolve, 1000));

		for (const activity of activityList) delete activity.keepAliveId;

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
			process.exit(0);
		});
	};
};

module.exports = new ClientManager();