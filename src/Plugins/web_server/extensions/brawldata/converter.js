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
			const entryData = entry.split(separator.data);
			if (entry.length > 0) data[entryData[1]][entryData[0]] = entryData.slice(2)[0];
		}
	}

	for (const brawlerFile of brawlers) {
		if (brawlerFile.endsWith(".bsdata")) {
			// Add brawler to brawlers list
		}
	}

	if (battlelog) {
		for (const entry of battlelog.split(separator.entry)) {
			const entryData = entry.split(separator.data);

			if (entry.length > 0) {
				const type = entryData[1];

				const format = (value, action, ...extra) => {
					const next = (v) => extra.length > 0 ? format(v, extra[0], extra.slice(1)) : v;

					switch (action) {
						case "optional":
							if (value == "") return undefined;
							else return next(value);
							break;

						case "number":
							return next(Number(value));
							break;
					}

					return value;
				};

				const battle = {
					date: format(entryData[0], "number"),
					duration: format(entryData[2], "number"),
					event: format(entryData[3], "number"),
					mode: entryData[4],
					rank: format(entryData[5], "optional", "number"),
					result: entryData[6],
					starPlayer: format(entryData[7], "optional"),
					trophies: format(entryData[8], "optional", "number"),
					type
				};

				if (soloModes.includes(type)) {
					battle.players = [];

					const playersData = entryData[9].split(separator.player.team);

					for (const playerDataString of playersData) {
						const playerData = playerDataString.split(separator.player.data);

						const player = {
							brawler: format(playerData[2], "number"),
							name: playerData[1],
							power: format(playerData[3], "number"),
							tag: playerData[0]
						};

						if (battle.mode == "soloRanked") player.rank = format(playerData[4], "number");
						else player.trophies = format(playerData[4], "number");

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
								brawler: format(playerData[2], "number"),
								name: playerData[1],
								power: format(playerData[3], "number"),
								tag: playerData[0]
							};

							if (battle.mode == "soloRanked") player.rank = format(playerData[4], "number");
							else player.trophies = format(playerData[4], "number");

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

	/* data.brawlers.forEach((brawlerData) => {
		const append = (...data) => fs.appendFileSync(paths.brawler(id, brawlerData.id - 16000000), data.join(separator.data) + separator.entry, fsOptions);
		const check = (date, key, value) => {
			if (previousData.brawlers?.[key]) {
				const values = Object.values(previousData.brawlers[key]);
				if (values[values.length - 1] == value) return;
			}

			append(date, key, value);
		};

		check(now, "power", brawlerData.power);
		check(now, "rank", brawlerData.rank);
		check(now, "trophies", brawlerData.trophies);
		check(now, "trophies.highest", brawlerData.highestTrophies);
	}); */

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

module.exports = {
	readUser,
	writeUser
};