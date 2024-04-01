const fs = require("fs");
const path = require("path");

const log = require("./log");
const request = require("./request");
const { wait, toProperCase } = require("./utils");

const config = require("./config");

/**
 * @typedef {object} Brawler
 * @property {string} name
 */

/**
 * @typedef {object} Player
 * @property {number} brawler
 * @property {string} id
 * @property {string} name
 * @property {number} power
 * @property {number} trophies
 */

/**
 * @typedef {object} Battle
 * @property {string} date
 * @property {number?} duration
 * @property {number} map
 * @property {string} mode
 * @property {string?} mvp
 * @property {Player[]} players
 * @property {number?} rank
 * @property {Player[][]} teams
 * @property {number} trophies
 * @property {boolean?} win
 */

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

const root = path.join(process.env.HOME, "BrawlData DB");

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
 * @returns {Promise<Object<number, Brawler>?>}
 */
const getBrawlersList = async () => {
	const response = await api("/brawlers");

	try {
		/**
		 * @type {Object<number, Brawler>}
		 */
		const brawlers = {};

		for (const brawlerData of response.items) brawlers[brawlerData.id] = toProperCase(brawlerData.name)

		return brawlers;
	} catch (e) {
		return {};
	}
};


/**
 * @param {string} id
 * @returns {Promise<Battle[]?>}
 */
const getBattlelog = async (id) => {
	const battleResponse = await api(`/players/%23${id}/battlelog`);

	try {
		/**
		 * @type {Battle[]}
		 */
		const battles = [];

		for (const battleData of battleResponse.items) {
			/**
			 * @type {Battle}
			 */
			let battle;

			const addPlayers = () => {
				for (const playerData of battleData.battle.players) {
					battle.players.push({
						brawler: playerData.brawler.id,
						id: playerData.tag.slice(1),
						name: playerData.name,
						power: playerData.brawler.power,
						trophies: playerData.brawler.trophies
					});
				}
			};

			const addTeams = () => {
				for (const teamData of battleData.battle.teams) {
					/**
					 * @type {Player[]}
					 */
					const team = [];

					for (const playerData of teamData) {
						team.push({
							brawler: playerData.brawler.id,
							id: playerData.tag.slice(1),
							name: playerData.name,
							power: playerData.brawler.power,
							trophies: playerData.brawler.trophies
						});
					}

					battle.teams.push(team);
				}
			};

			switch (battleData.battle.mode.toLowerCase()) {
				case "soloshowdown":
					battle = {
						date: new Date(`${battleData.battleTime.slice(0, 4)}-${battleData.battleTime.slice(4, 6)}-${battleData.battleTime.slice(6, 8)}T${battleData.battleTime.slice(9, 11)}:${battleData.battleTime.slice(11, 13)}:${battleData.battleTime.slice(13)}`).toISOString(),
						map: battleData.event.id,
						mode: battleData.battle.mode.toLowerCase(),
						rank: battleData.battle.rank,
						players: [],
						trophies: battleData.battle.trophyChange
					};

					addPlayers();
					break;

				case "duoshowdown":
					battle = {
						date: new Date(`${battleData.battleTime.slice(0, 4)}-${battleData.battleTime.slice(4, 6)}-${battleData.battleTime.slice(6, 8)}T${battleData.battleTime.slice(9, 11)}:${battleData.battleTime.slice(11, 13)}:${battleData.battleTime.slice(13)}`).toISOString(),
						map: battleData.event.id,
						mode: battleData.battle.mode.toLowerCase(),
						rank: battleData.battle.rank,
						teams: [],
						trophies: battleData.battle.trophyChange
					};

					addTeams();
					break;

				default:
					battle = {
						date: new Date(`${battleData.battleTime.slice(0, 4)}-${battleData.battleTime.slice(4, 6)}-${battleData.battleTime.slice(6, 8)}T${battleData.battleTime.slice(9, 11)}:${battleData.battleTime.slice(11, 13)}:${battleData.battleTime.slice(13)}`).toISOString(),
						duration: battleData.battle.duration,
						map: battleData.event.id,
						mode: battleData.battle.mode.toLowerCase(),
						mvp: battleData.battle.starPlayer?.tag?.slice(1),
						teams: [],
						trophies: battleData.battle.trophyChange,
						win: [true, false][["victory", "defeat"].indexOf(battleData.battle.result)]
					};

					addTeams();
					break;
			};

			battles.push(battle);
		}

		return battles;
	} catch (e) {
		log(`Failed to fetch battlelog of #${id}: ${e}`);
		return [];
	}
};

/**
 * @param {string} id
 * @returns {Promise<DataEntry?>}
 */
const getData = async (id) => {
	const userResponse = await api(`/players/%23${id}`);

	try {
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
			}
		};

		for (const brawler of userResponse.brawlers) {
			brawler.trophies = {
				current: brawler.trophies,
				highest: brawler.highestTrophies
			};

			delete brawler.name;
			delete brawler.highestTrophies;
			delete brawler.gears;
			delete brawler.starPowers;
			delete brawler.gadgets;

			data.brawlers.push(brawler);
		}

		return data;
	} catch (e) {
		log(`Failed to fetch data of #${id}: ${e}`);
		return {};
	}
};

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
const track = async (id) => {
	const date = new Date().toISOString();

	const directory = path.join(root, "users", id);

	const recentBattles = await getBattlelog(id);
	const data = await getData(id);

	/**
	 * @type {Battle[]}
	 */
	let battlelog = [];

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

	if (fs.existsSync(path.join(directory, "battlelog.json"))) battlelog = JSON.parse(fs.readFileSync(path.join(directory, "battlelog.json")));
	if (fs.existsSync(path.join(directory, "stats.json"))) stats = JSON.parse(fs.readFileSync(path.join(directory, "stats.json")));

	battlelog = battlelog.concat(recentBattles);

	if (Object.values(stats.club)[Object.values(stats.club).length - 1] != data.club) stats.club[date] = data.club;
	if (Object.values(stats.name)[Object.values(stats.name).length - 1] != data.name) stats.name[date] = data.name;
	if (Object.values(stats.trophies)[Object.values(stats.trophies).length - 1] != data.trophies.current) stats.trophies[date] = data.trophies.current;
	for (const brawler of data.brawlers) {
		const index = stats.brawlers.findIndex((brawlerStats) => brawlerStats.id == brawler.id);
		if (index == -1) stats.brawlers.push({
			id: brawler.id,
			trophies: {
				[date]: brawler.trophies.current
			}
		})
		else if (Object.values(stats.brawlers[index].trophies)[Object.values(stats.brawlers[index].trophies).length - 1] != brawler.trophies.current) stats.brawlers[index].trophies[date] = brawler.trophies.current;
	}

	battlelog = (() => {
		const seenDates = {};
		const uniqueBattles = [];

		for (const battle of battlelog) {
			if (!seenDates[battle.date]) {
				seenDates[battle.date] = true;
				uniqueBattles.push(battle);
			}
		}

		return uniqueBattles;
	})();
	battlelog.sort((battleA, battleB) => new Date(battleB.date).getDate() - new Date(battleA.date).getDate());

	if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
	fs.writeFileSync(path.join(directory, "battlelog.json"), JSON.stringify(battlelog, null, 4));
	fs.writeFileSync(path.join(directory, "latest.json"), JSON.stringify(data, null, 4));
	fs.writeFileSync(path.join(directory, "stats.json"), JSON.stringify(stats, null, 4));
};

const cycle = async (time) => {
	if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true });
	fs.writeFileSync(path.join(root, "brawlers.json"), JSON.stringify(await getBrawlersList(), null, 4));

	for (const id of config.profiles) await track(id);
	setTimeout(cycle, time);
};

module.exports = {
	cycle,
	getBattlelog,
	getData
};