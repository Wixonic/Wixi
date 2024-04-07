const path = require("path");
const fs = require("fs");

const log = require("./log");
const { toTime } = require("./utils");

const config = require("./config");

////////// CLUBS //////////////////////////////////
const readClub = (id) => {
	let data = null;

	if (fs.existsSync(config.paths.club(id)) && fs.statSync(config.paths.club(id)).isDirectory()) {
		// 
	}

	return data;
};

const writeClub = (id) => {
	const writeStartTimestamp = Date.now();
	let modified = false;

	const previousData = readClub(id) ?? {};

	// 

	const writeEndTimestamp = Date.now();
	if (modified) log(`Club ${id} data written in ${toTime(writeStartTimestamp, writeEndTimestamp)}`);
};
////////// CLUBS //////////////////////////////////
////////// USERS, BATTLELOGS AND BRAWLERS /////////
const soloModes = [
	"soloShowdown"
];

const readPlayer = (id) => {
	let data = null;

	if (fs.existsSync(config.paths.player(id)) && fs.statSync(config.paths.player(id)).isDirectory()) {
		data = {
			battles: [],
			brawlers: {},
			"club.name": {},
			"club.tag": {},
			color: {},
			icon: {},
			level: {},
			name: {},
			trophies: {},
			"trophies.highest": {}
		};

		const player = fs.existsSync(config.paths.player.data(id)) ? fs.readFileSync(config.paths.player.data(id), "utf-8").toString() : null;
		const brawlers = fs.existsSync(config.paths.player.brawler.list(id)) ? fs.readdirSync(config.paths.player.brawler.list(id), "utf-8") : [];
		const battlelog = fs.existsSync(config.paths.player.battlelog(id)) ? fs.readFileSync(config.paths.player.battlelog(id), "utf-8").toString() : null;

		if (player) {
			for (const entry of player.split(config.api.separators.entry)) {
				const entryData = entry.split(config.api.separators.data);

				if (entry.length > 0) {
					const isNumber = ["icon", "level", "trophies", "trophies.highest"].includes(entryData[1]);
					data[entryData[1]][entryData[0]] = isNumber ? Number(entryData.slice(2)[0]) : entryData.slice(2)[0];
				}
			}
		}

		for (const brawlerFile of brawlers) {
			if (brawlerFile.endsWith(".bsdata")) {
				const brawlerId = brawlerFile.slice(0, -7);
				const brawler = fs.readFileSync(config.paths.player.brawler(id, brawlerId), "utf-8");

				if (brawler) {
					data.brawlers[brawlerId] = {
						power: {},
						rank: {},
						trophies: {},
						"trophies.highest": {}
					};

					for (const entry of brawler.split(config.api.separators.entry)) {
						const entryData = entry.split(config.api.separators.data);

						if (entry.length > 0) {
							const isNumber = ["power", "rank", "trophies", "trophies.highest"].includes(entryData[1]);
							data.brawlers[brawlerId][entryData[1]][entryData[0]] = isNumber ? Number(entryData.slice(2)[0]) : entryData.slice(2)[0];
						}
					}
				}
			}
		}

		if (battlelog) {
			for (const entry of battlelog.split(config.api.separators.entry)) {
				const entryData = entry.split(config.api.separators.data);

				if (entry.length > 0) {
					const type = entryData[1];

					const battle = {
						date: Number(entryData[0]),
						event: Number(entryData[3]),
						mode: entryData[4],
						type
					};

					if (entryData[1].length == 0) battle.type = "specialEvent";
					if (entryData[2].length > 0) battle.duration = Number(entryData[2]);
					if (entryData[4].length == 0) battle.mode = "unknown";
					if (entryData[5].length > 0) battle.rank = Number(entryData[5]);
					if (entryData[6].length > 0) battle.result = entryData[6];
					if (entryData[7].length > 0) battle.starPlayer = entryData[7];
					if (entryData[8].length > 0) battle.trophies = Number(entryData[8]);

					try {
						if (entryData[9].split(config.api.separators.team).length == 1) {
							battle.players = [];

							const playersData = entryData[9].split(config.api.separators.player.team);

							for (const playerDataString of playersData) {
								const playerData = playerDataString.split(config.api.separators.player.data);

								const player = {
									brawler: Number(playerData[2]),
									name: playerData[1],
									power: Number(playerData[3]),
									tag: playerData[0]
								};

								if (battle.mode == "soloRanked") player.rank = Number(playerData[4]);
								else player.trophies = Number(playerData[4]);

								battle.players.push(player);
							}
						} else if (entryData[9].split(config.api.separators.team).length > 1) {
							battle.teams = [];

							const teamsData = entryData[9].split(config.api.separators.team);

							for (const teamDataString of teamsData) {
								const team = [];

								for (const playerDataString of teamDataString.split(config.api.separators.player.team)) {
									const playerData = playerDataString.split(config.api.separators.player.data);

									const player = {
										brawler: Number(playerData[2]),
										name: playerData[1],
										power: Number(playerData[3]),
										tag: playerData[0]
									};

									if (battle.mode == "soloRanked") player.rank = Number(playerData[4]);
									else player.trophies = Number(playerData[4]);

									team.push(player);
								}

								battle.teams.push(team);
							}
						}
					} catch (e) {
						log("Failed to read players: " + e);
					}

					data.battles.push(battle);
				}
			}
		}

		data.battles.sort((battleA, battleB) => battleA.date - battleB.date);
	}

	return data;
};

const writePlayer = (id, data) => {
	const writeStartTimestamp = Date.now();
	let modified = false;

	const now = Math.floor(writeStartTimestamp / 1000);

	const previousData = readPlayer(id) ?? {};

	if (!fs.existsSync(config.paths.player(id))) fs.mkdirSync(config.paths.player(id), { recursive: true });
	if (!fs.existsSync(config.paths.player.brawler.list(id))) fs.mkdirSync(config.paths.player.brawler.list(id), { recursive: true });

	const append = (filePath, ...data) => fs.appendFileSync(filePath, data.join(config.api.separators.data) + config.api.separators.entry, "utf-8");
	const check = (date, key, value) => {
		if (previousData[key] && Object.values(previousData[key]).at(-1) == value) return;
		modified = true;
		append(config.paths.player.data(id), date, key, value);
	};

	check(now, "name", data.name);
	check(now, "color", data.nameColor);
	check(now, "icon", data.icon.id - 28000000);
	check(now, "trophies", data.trophies);
	check(now, "trophies.highest", data.highestTrophies);
	check(now, "level", data.expLevel);
	check(now, "club.name", data.club.name);
	check(now, "club.tag", data.club.tag);

	data.brawlers.forEach((brawlerData) => {
		const brawlerId = brawlerData.id - 16000000;
		const append = (...data) => fs.appendFileSync(config.paths.player.brawler(id, brawlerId), data.join(config.api.separators.data) + config.api.separators.entry, "utf-8");
		const check = (date, key, value) => {
			if (previousData.brawlers && previousData.brawlers[brawlerId] && previousData.brawlers[brawlerId][key] && Object.values(previousData.brawlers[brawlerId][key]).at(-1) == value) return;
			modified = true;
			append(date, key, value);
		};

		check(now, "power", brawlerData.power);
		check(now, "rank", brawlerData.rank);
		check(now, "trophies", brawlerData.trophies);
		check(now, "trophies.highest", brawlerData.highestTrophies);
	});

	data.battlelog.forEach((battleData) => {
		battleData.date = Math.floor(new Date(`${battleData.battleTime.slice(0, 4)}-${battleData.battleTime.slice(4, 6)}-${battleData.battleTime.slice(6, 8)}T${battleData.battleTime.slice(9, 11)}:${battleData.battleTime.slice(11, 13)}:${battleData.battleTime.slice(13)}`).getTime() / 1000);
		battleData.playersData = "";

		if (battleData.battle.players) {
			const playersData = battleData.battle.players;
			const players = [];

			for (const playerData of playersData ?? []) players.push([playerData.tag, playerData.name, playerData.brawler.id - 16000000, playerData.brawler.power, playerData.brawler.trophies].join(config.api.separators.player.data));

			battleData.playersData = players.join(config.api.separators.player.team);
		} else if (battleData.battle.teams) {
			const teamsData = battleData.battle.teams;
			const teams = [];

			for (const teamData of teamsData ?? []) {
				const team = [];

				for (const playerData of teamData) team.push([playerData.tag, playerData.name, playerData.brawler.id - 16000000, playerData.brawler.power, ["championshipChallenge"].includes(battleData.battle.type) ? "" : playerData.brawler.trophies].join(config.api.separators.player.data));

				teams.push(team.join(config.api.separators.player.team));
			}

			battleData.playersData = teams.join(config.api.separators.team);
		} else battleData.playersData = "";
	});

	data.battlelog = data.battlelog.filter((battle) => battle.date - (previousData?.battles?.at(-1)?.date ?? 0) > 0);
	data.battlelog.sort((battleA, battleB) => battleA.date - battleB.date);

	for (const battleData of data.battlelog) append(config.paths.player.battlelog(id), battleData.date ?? "", battleData.battle.type, Number.isInteger(battleData.battle.duration) ? battleData.battle.duration : "", battleData.event.id == 0 ? 0 : battleData.event.id - 15000000 + 1, battleData.battle.mode, battleData.battle.rank ?? "", battleData.battle.result ?? "", battleData.battle.starPlayer?.tag ?? "", Number.isInteger(battleData.battle.trophyChange) ? battleData.battle.trophyChange : "", battleData.playersData);

	const writeEndTimestamp = Date.now();
	if (modified) log(`Player ${id} data written in ${toTime(writeStartTimestamp, writeEndTimestamp)}`);
};
////////// USERS, BATTLELOGS AND BRAWLERS /////////

module.exports = {
	readClub,
	writeClub,
	readPlayer,
	writePlayer
};