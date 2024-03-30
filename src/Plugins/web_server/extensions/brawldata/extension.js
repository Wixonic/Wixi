const fs = require("fs");
const path = require("path");

const log = require("./log");
const request = require("./request");
const { wait } = require("./utils");

const config = require("./config");

/**
 * @typedef {object} TrophiesData
 * @property {number} current
 * @property {number} highest
 */

/**
 * @typedef {object} BrawlerData
 * @property {number} id
 * @property {string} name
 * @property {number} power
 * @property {number} rank
 * @property {TrophiesData} trophies
 */

/**
 * @typedef {object} DataEntry
 * @property {BrawlerData[]?} brawlers
 * @property {string?} club
 * @property {string?} id
 * @property {string?} name
 * @property {TrophiesData?} trophies
 * @property {boolean} valid
 */

/**
 * @typedef {object} BrawlerStats
 * @property {number} id
 * @property {string} name
 * @property {Object<string, number>} trophies
 */

/**
 * @typedef {object} StatsEntry
 * @property {BrawlerStats[]?} brawlers
 * @property {Object<string, string>?} club
 * @property {string?} id
 * @property {Object<string, string>?} name
 * @property {Object<string, number>?} trophies
 */

const root = path.join(__dirname, "database");

/**
 * @param {string} endpoint 
 * @param {string} method 
 * @returns {Promise<object?>}
 */
const api = async (endpoint = "/", method = "GET") => {
	for (let tries = 1; tries <= 5; ++tries) {
		const response = await request({
			headers: {
				accept: "application/json",
				authorization: `Bearer: ${config.token}`
			},
			method,
			type: "json",
			url: new URL(path.join("v1", endpoint), "https://api.brawlstars.com")
		});

		if (response && !response.error) return response;
		await wait(1000);
	}

	return null;
};

/**
 * @param {string} id
 * @returns {Promise<DataEntry>}
 */
const getData = async (id) => {
	// const battleResponse = await api(`/players/%23${id}/battlelog`);
	const userResponse = await api(`/players/%23${id}`);

	if (/* battleResponse && !battleResponse.error && */ userResponse && !userResponse.error) {
		/**
		 * @type {DataEntry}
		 */
		const data = {
			brawlers: [],
			club: userResponse.club?.tag?.slice(1),
			id,
			name: userResponse.name,
			trophies: {
				current: userResponse.trophies,
				highest: userResponse.highestTrophies
			},
			valid: true
		};

		for (const brawler of userResponse.brawlers) {
			brawler.name = brawler.name.toLowerCase();
			brawler.trophies = {
				current: brawler.trophies,
				highest: brawler.highestTrophies
			};

			delete brawler.highestTrophies;
			delete brawler.gears;
			delete brawler.starPowers;
			delete brawler.gadgets;

			data.brawlers.push(brawler);
		}

		log(`${data.name} data fetched`);
		return data;
	}

	log(`Failed to fetch data of #${id}`);

	return {
		valid: false
	};
};

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
const track = async (id) => {
	const date = new Date().toISOString();

	const directory = path.join(root, "users", id);

	const data = await getData(id);

	/**
	 * @type {StatsEntry}
	 */
	let stats = {
		brawlers: [],
		club: {},
		id,
		name: {},
		trophies: {}
	};

	if (fs.existsSync(path.join(directory, "stats.json"))) stats = JSON.parse(fs.readFileSync(path.join(directory, "stats.json")));

	stats.club[date] = data.club;
	stats.name[date] = data.name;
	stats.trophies[date] = data.trophies.current;

	for (const brawler of data.brawlers) {
		const index = stats.brawlers.findIndex((brawlerStats) => brawlerStats.id == brawler.id);
		if (index == -1) stats.brawlers.push({
			id: brawler.id,
			name: brawler.name,
			trophies: {
				[date]: brawler.trophies.current
			}
		})
		else stats.brawlers[index].trophies[date] = brawler.trophies.current;
	}

	if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
	fs.writeFileSync(path.join(directory, "latest.json"), JSON.stringify(data, null, 4));
	fs.writeFileSync(path.join(directory, "stats.json"), JSON.stringify(stats, null, 4));
};

const cycle = async () => {
	for (const id of config.profiles) await track(id);
	setTimeout(cycle, 3600 / 4 * 1000); // Every 15 minutes
};

module.exports = async (_, _2) => {
	await cycle();
};