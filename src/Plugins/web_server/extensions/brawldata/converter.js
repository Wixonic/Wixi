const path = require("path");
const fs = require("fs");

const config = require("./config");

/**
 * @type {BufferEncoding}
 */
const fsOptions = "utf8";

const paths = {
	battlelog: (id) => path.join(paths.main(id), "battlelog.bsldata"),
	brawlers: (id) => path.join(paths.main(id), "brawlers"),
	brawler: (userId, brawlerId) => path.join(paths.brawlers(userId), `${brawlerId}.bsdata`),
	main: (id) => path.join(config.root, "users", id),
	user: (id) => path.join(paths.main(id), "user.bsdata")
};

const separator = {
	data: "\uF002",
	entry: "\n",
	player: {
		data: "\uF005",
		team: "\uF004"
	},
	team: "\uF003"
};

////////// CLUBS //////////////////////////////////
const readClub = (id) => {

};

const writeClub = (id) => {

};
////////// CLUBS //////////////////////////////////
////////// USERS, BATTLELOGS AND BRAWLERS /////////
const soloModes = [
	"soloShowdown"
];

const readUser = (id) => {
	const data = {
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

	const user = fs.existsSync(paths.user(id)) ? fs.readFileSync(paths.user(id), fsOptions).toString() : null;
	const brawlers = fs.existsSync(paths.brawlers(id)) ? fs.readdirSync(paths.brawlers(id), fsOptions) : [];
	const battlelog = fs.existsSync(paths.battlelog(id)) ? fs.readFileSync(paths.battlelog(id), fsOptions).toString() : null;

	if (user) {
		for (const entry of user.split(separator.entry)) {
			const entryData = entry.split(separator.data);;

			if (entry.length > 0) {
				const isNumber = ["icon", "level", "trophies", "trophies.highest"].includes(entryData[1]);
				data[entryData[1]][entryData[0]] = isNumber ? Number(entryData.slice(2)[0]) : entryData.slice(2)[0];
			}
		}
	}

	for (const brawlerFile of brawlers) {
		if (brawlerFile.endsWith(".bsdata")) {
			const brawlerId = brawlerFile.slice(0, -7);
			const brawler = fs.readFileSync(paths.brawler(id, brawlerId), fsOptions);

			if (brawler) {
				data.brawlers[brawlerId] = {
					power: {},
					rank: {},
					trophies: {},
					"trophies.highest": {}
				};

				for (const entry of brawler.split(separator.entry)) {
					const entryData = entry.split(separator.data);

					if (entry.length > 0) {
						const isNumber = ["power", "rank", "trophies", "trophies.highest"].includes(entryData[1]);
						data.brawlers[brawlerId][entryData[1]][entryData[0]] = isNumber ? Number(entryData.slice(2)[0]) : entryData.slice(2)[0];
					}
				}
			}
		}
	}

	if (battlelog) {
		for (const entry of battlelog.split(separator.entry)) {
			const entryData = entry.split(separator.data);

			if (entry.length > 0) {
				const type = entryData[1];

				const battle = {
					date: Number(entryData[0]),
					event: Number(entryData[3]),
					mode: entryData[4],
					type
				};

				if (entryData[2].length > 0) battle.duration = Number(entryData[2]);
				if (entryData[5].length > 0) battle.rank = Number(entryData[5]);
				if (entryData[6].length > 0) battle.result = entryData[6];
				if (entryData[7].length > 0) battle.starPlayer = entryData[7];
				if (entryData[8].length > 0) battle.trophies = Number(entryData[8]);

				if (soloModes.includes(type)) {
					battle.players = [];

					const playersData = entryData[9].split(separator.player.team);

					for (const playerDataString of playersData) {
						const playerData = playerDataString.split(separator.player.data);

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
				} else {
					battle.teams = [];

					const teamsData = entryData[9].split(separator.team);

					for (const teamDataString of teamsData) {
						const team = [];

						for (const playerDataString of teamDataString.split(separator.player.team)) {
							const playerData = playerDataString.split(separator.player.data);

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

				data.battles.push(battle);
			}
		}
	}

	data.battles.sort((battleA, battleB) => battleA.date - battleB.date);

	return data;
};

const writeUser = (id, data) => {
	const now = Math.floor(Date.now() / 1000);

	const previousData = readUser(id);

	const userPath = path.join(config.root, "users", id);
	const brawlersPath = path.join(config.root, "users", id, "brawlers");

	if (!fs.existsSync(userPath)) fs.mkdirSync(userPath, { recursive: true });
	if (!fs.existsSync(brawlersPath)) fs.mkdirSync(brawlersPath, { recursive: true });

	const append = (filePath, ...data) => fs.appendFileSync(filePath, data.join(separator.data) + separator.entry, fsOptions);
	const check = (date, key, value) => {
		if (previousData[key]) {
			const values = Object.values(previousData[key]);
			if (values[values.length - 1] == value) return;
		}

		append(paths.user(id), date, key, value);
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
		const append = (...data) => fs.appendFileSync(paths.brawler(id, brawlerId), data.join(separator.data) + separator.entry, fsOptions);
		const check = (date, key, value) => {
			if (previousData.brawlers[brawlerId] && previousData.brawlers[brawlerId][key]) {
				const values = Object.values(previousData.brawlers[brawlerId][key]);
				if (values[values.length - 1] == value) return;
			}

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

		if (soloModes.includes(battleData.battle.mode)) {
			const playersData = battleData.battle.players;
			const players = [];

			for (const playerData of playersData) players.push([playerData.tag, playerData.name, playerData.brawler.id - 16000000, playerData.brawler.power, playerData.brawler.trophies].join(separator.player.data));

			battleData.playersData = players.join(separator.player.team);
		} else {
			const teamsData = battleData.battle.teams;
			const teams = [];

			for (const teamData of teamsData) {
				const team = [];

				for (const playerData of teamData) team.push([playerData.tag, playerData.name, playerData.brawler.id - 16000000, playerData.brawler.power, playerData.brawler.trophies].join(separator.player.data));

				teams.push(team.join(separator.player.team));
			}

			battleData.playersData = teams.join(separator.team);
		}
	});

	data.battlelog = data.battlelog.filter((battle) => battle.date - (previousData.battles[previousData.battles.length - 1]?.date ?? 0) > 0);
	data.battlelog.sort((battleA, battleB) => battleA.date - battleB.date);

	for (const battleData of data.battlelog) append(paths.battlelog(id), battleData.date, battleData.battle.type, battleData.battle.duration ?? "", battleData.event.id == 0 ? 0 : battleData.event.id - 15000000 + 1, battleData.battle.mode, battleData.battle.rank ?? "", battleData.battle.result ?? "", battleData.battle.starPlayer?.tag ?? "", battleData.battle.trophyChange ?? "", battleData.playersData);
};
////////// USERS, BATTLELOGS AND BRAWLERS /////////

module.exports = {
	readClub,
	writeClub,
	readUser,
	writeUser
};