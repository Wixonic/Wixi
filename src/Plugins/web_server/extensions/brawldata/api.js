const fs = require("fs");
const path = require("path");

const { writeClub, writeUser } = require("./converter");
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
const user = async (id) => {
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
	router.get("/users", (req, res) => {
		fs.readdirSync(config.paths.user.list(), config.fsOptions);

		const users = {

		};
	});
};

const cycle = async (time) => {
	const cycleStartTimestamp = Date.now();
	log("Refresh cycle started");

	for (const clubId of config.clubs) {
		const data = await club(clubId);
		writeClub(clubId, data);
	}

	for (const userId of config.users) {
		const data = await user(userId);
		writeUser(userId, data);
	}

	setTimeout(cycle, time);

	const cycleEndTimestamp = Date.now();
	log(`Refresh cycle ended - total duration: ${toTime(cycleStartTimestamp, cycleEndTimestamp)}`);
};

module.exports = {
	connect,
	cycle
};