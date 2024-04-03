const path = require("path");
const fs = require("fs");

const config = require("./config");

const soloModes = [
	"soloShowdown"
];

const separator = {
	data: "<|2|>",
	entry: "<|1|>",
	player: {
		data: "<|5|>",
		team: "<|4|>"
	},
	team: "<|3|>"
};

const readUser = (id) => {
	const userPath = path.join(config.root, "users", id);

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

	const user = fs.existsSync(path.join(userPath, "user.log")) ? fs.readFileSync(path.join(userPath, "user.log")).toString() : null;
	const brawlers = fs.existsSync(path.join(userPath, "user.brawlers.log")) ? fs.readFileSync(path.join(userPath, "user.brawlers.log")).toString() : null;
	const battlelog = fs.existsSync(path.join(userPath, "user.battle.log")) ? fs.readFileSync(path.join(userPath, "user.battle.log")).toString() : null;

	if (user) {
		for (const entry of user.split(separator.entry)) {
			const entryData = entry.split(separator.data);
			if (entry.length > 0) data[entryData[1]][entryData[0]] = entryData.slice(2)[0];
		}
	}

	if (brawlers) {
		for (const entry of brawlers.split(separator.entry)) {
			const entryData = entry.split(separator.data);

			if (entry.length > 0) {
				// Brawlers list
			}
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

	console.log(JSON.stringify(previousData, null, 4));

	const userPath = path.join(config.root, "users", id);

	if (!fs.existsSync(userPath)) fs.mkdirSync(userPath, { recursive: true });
	const append = (fileName, ...data) => fs.appendFileSync(path.join(userPath, fileName), data.join(separator.data) + separator.entry);

	const check = (fileName, date, key, value) => {
		const values = Object.values(previousData[key]);
		if (values[values.length - 1] != value) append(fileName, date, key, value);
	};

	check("user.log", now, "name", data.name);
	check("user.log", now, "color", data.nameColor);
	check("user.log", now, "icon", data.icon.id - 28000000);
	check("user.log", now, "trophies", data.trophies);
	check("user.log", now, "trophies.highest", data.highestTrophies);
	check("user.log", now, "level", data.expLevel);
	check("user.log", now, "club.name", data.club.name);
	check("user.log", now, "club.tag", data.club.tag);

	data.battlelog.forEach((battleData) => {
		battleData.date = Math.floor(new Date(`${battleData.battleTime.slice(0, 4)}-${battleData.battleTime.slice(4, 6)}-${battleData.battleTime.slice(6, 8)}T${battleData.battleTime.slice(9, 11)}:${battleData.battleTime.slice(11, 13)}:${battleData.battleTime.slice(13)}`).getTime() / 1000);
		battleData.playersData = "";

		if (soloModes.includes(battleData.battle.type)) {
			const playersData = battleData.battle.players;
			const players = [];

			for (const playerData of playersData) players.push([playerData.tag, playerData.name, playerData.brawler.id - 16000000, playerData.brawler.power, playerData.brawler.trophies].join(separator.player.data));

			battleData.playersData = players.join(separator.player.team);
		} else {
			const teamsData = battleData.battle.teams;
			const teams = [];

			for (let i = 0; i < teamsData.length; ++i) {
				const team = [];

				for (const playerData of teamsData[i]) team.push([playerData.tag, playerData.name, playerData.brawler.id - 16000000, playerData.brawler.power, playerData.brawler.trophies].join(separator.player.data));

				teams.push(team.join(separator.player.team));
			}

			battleData.playersData = teams.join(separator.team);
		}
	});

	data.battlelog = data.battlelog.filter((battle) => battle.date - (previousData.battles[previousData.battles.length - 1]?.date ?? 0) > 0);
	data.battlelog.sort((battleA, battleB) => battleA.date - battleB.date);

	for (const battleData of data.battlelog) append("user.battle.log", battleData.date, battleData.battle.type, battleData.battle.duration ?? "", battleData.event.id == 0 ? 0 : battleData.event.id - 15000000 + 1, battleData.battle.mode, battleData.battle.rank ?? "", battleData.battle.result ?? "", battleData.battle.starPlayer?.tag ?? "", battleData.battle.trophyChange ?? "", battleData.playersData);
};

module.exports = {
	readUser,
	writeUser
};