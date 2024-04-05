const fs = require("fs");
const path = require("path");

const { writeClub, writePlayer, readPlayer } = require("./converter");
const log = require("./log");
const request = require("./request");
const { wait, toTime } = require("./utils");

const config = require("./config");

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

	return {
		error: "Failed to load"
	};
};

/**
 * @param {string} id
 */
const club = async (id) => {
	const dataStartTimestamp = Date.now();
	log(`Fetching data of club ${id}`);

	const encodedId = encodeURIComponent(id);

	const data = await api(`/clubs/${encodedId}`);
	const members = await api(`/clubs/${encodedId}/members`);

	data.members = members?.items;

	const dataEndTimestamp = Date.now();
	log(`Club ${id} data fetched in ${toTime(dataStartTimestamp, dataEndTimestamp)}`);

	return data;
};

/**
 * @param {string} id
 */
const player = async (id) => {
	const dataStartTimestamp = Date.now();
	log(`Fetching data of player ${id}`);

	const encodedId = encodeURIComponent(id);

	const data = await api(`/players/${encodedId}`);
	const battlelog = await api(`/players/${encodedId}/battlelog`);

	data.battlelog = battlelog?.items;

	const dataEndTimestamp = Date.now();
	log(`Player ${id} data fetched in ${toTime(dataStartTimestamp, dataEndTimestamp)}`);

	return data;
};

/**
 * @param {import("express").Router} router
 */
const connect = async (router) => {
	router.get("/players", (_, res) => {
		const players = [];

		for (const playerId of fs.readdirSync(config.paths.player.list(), "utf-8")) {
			if (playerId.startsWith("#")) {
				const playerData = readPlayer(playerId);

				const icons = Object.values(playerData.icon);
				const names = Object.values(playerData.name);
				const trophies = Object.values(playerData.trophies);

				if (names.length > 0) {
					players.push({
						icon: icons[icons.length - 1],
						id: playerId,
						name: names[names.length - 1],
						trophies: trophies[trophies.length - 1]
					});
				}
			}
		}

		players.sort((playerA, playerB) => {
			if (playerA.name.toLowerCase() < playerB.name.toLowerCase()) return -1;
			if (playerA.name.toLowerCase() > playerB.name.toLowerCase()) return 1;
			return 0;
		});

		res.writeHead(players.length > 0 ? 200 : 204, {
			"content-type": "application/json"
		}).write(JSON.stringify({
			code: players.length > 0 ? 200 : 204,
			items: players
		}));
		res.end();
	});

	router.get("/players/:id", (req, res) => {
		const playerId = req.params.id;

		const playerData = readPlayer("#" + playerId);

		res.writeHead(200, {
			"content-type": "application/json"
		}).write(JSON.stringify({
			code: 200,
			data: playerData
		}));

		res.end();
	});
};

const cycle = async (time) => {
	const cycleStartTimestamp = Date.now();
	log("Refresh cycle started");

	for (const clubId of config.clubs) {
		const data = await club(clubId);
		writeClub(clubId, data);
	}

	for (const playerId of config.players) {
		const data = await player(playerId);
		writePlayer(playerId, data);
	}

	setTimeout(() => cycle(time), time);

	const cycleEndTimestamp = Date.now();
	log(`Refresh cycle ended - total duration: ${toTime(cycleStartTimestamp, cycleEndTimestamp)}`);
};

module.exports = {
	connect,
	cycle
};