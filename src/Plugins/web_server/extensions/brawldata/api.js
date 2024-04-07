const fs = require("fs");
const path = require("path");

const { writeClub, readClub, writePlayer, readPlayer } = require("./converter");
const log = require("./log");
const request = require("./request");
const { toProperCase, toTime, wait } = require("./utils");

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
	const encodedId = encodeURIComponent(id);

	const data = await api(`/clubs/${encodedId}`);
	const members = await api(`/clubs/${encodedId}/members`);

	data.members = members?.items;

	return data;
};

/**
 * @param {string} id
 */
const player = async (id) => {

	const encodedId = encodeURIComponent(id);

	const data = await api(`/players/${encodedId}`);
	const battlelog = await api(`/players/${encodedId}/battlelog`);

	data.battlelog = battlelog?.items;

	return data;
};

/**
 * @param {import("express").Router} router
 */
const connect = async (router) => {
	router.get("/brawlers", (req, res) => {
		if (fs.existsSync(config.paths.brawlers())) {
			const brawlers = JSON.parse(fs.readFileSync(config.paths.brawlers(), "utf-8"));

			res.writeHead(200, {
				"content-type": "application/json"
			}).write(JSON.stringify({
				code: 200,
				items: brawlers
			}));
		} else res.writeHead(404).write(JSON.stringify({
			code: 404,
			error: "Not Found"
		}, null, 4));

		res.end();
		log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 2xx: ${path.join("/api", req.url)}`)
	});

	router.get("/players", (req, res) => {
		const players = [];

		if (fs.existsSync(config.paths.player.list())) {
			for (const playerId of fs.readdirSync(config.paths.player.list(), "utf-8")) {
				if (playerId.startsWith("#")) {
					const playerData = readPlayer(playerId);

					if (playerData) {
						players.push({
							icon: Object.values(playerData.icon).at(-1),
							id: playerId,
							name: Object.values(playerData.name).at(-1)
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
		} else {
			res.writeHead(players.length > 0 ? 200 : 204, {
				"content-type": "application/json"
			}).write(JSON.stringify({
				code: 204,
				items: players
			}));
		}

		log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 2xx: ${path.join("/api", req.url)}`)
		res.end();
	});

	router.get("/players/:id", (req, res) => {
		const playerId = req.params.id;

		const playerData = readPlayer("#" + playerId);

		if (playerData) {
			res.writeHead(200, {
				"content-type": "application/json"
			}).write(JSON.stringify({
				code: 200,
				data: playerData
			}));
		} else res.writeHead(404).write(JSON.stringify({
			code: 404,
			error: "Not Found"
		}));

		res.end();
		log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 2xx: ${path.join("/api", req.url)}`)
	});
};

const cycle = async (time) => {
	const brawlersData = await api("/brawlers")
	if (!brawlersData.error) {
		const brawlers = {};

		for (const brawler of brawlersData.items ?? []) {
			brawlers[brawler.id - 16000000] = {
				name: toProperCase(brawler.name)
			};
		}
		if (!fs.existsSync(config.root)) fs.mkdirSync(config.root, { recursive: true });
		fs.writeFileSync(config.paths.brawlers(), JSON.stringify(brawlers, null, 4), "utf-8");
	}

	for (const clubId of config.clubs) {
		const data = await club(clubId);
		writeClub(clubId, data);
	}

	for (const playerId of config.players) {
		const data = await player(playerId);
		writePlayer(playerId, data);
	}

	setTimeout(() => cycle(time), time);
};

module.exports = {
	connect,
	cycle
};