const fs = require("fs");
const path = require("path");

const { writeClub, writeUser } = require("./converter");
const log = require("./log");
const request = require("./request");
const { wait } = require("./utils");

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
	id = encodeURIComponent(id);

	const data = await api(`/clubs/${id}`);
	const members = await api(`/clubs/${id}/members`);

	data.members = members?.items;

	return data;
};

/**
 * @param {string} id
 */
const user = async (id) => {
	id = encodeURIComponent(id);

	const data = await api(`/players/${id}`);
	const battlelog = await api(`/players/${id}/battlelog`);

	data.battlelog = battlelog?.items;

	return data;
};

/**
 * @param {import("express").Router} router
 */
const connect = async (router) => {
	router.get("/", (req, res) => {

	});
};

const cycle = async (time) => {
	for (const clubId of config.clubs) {
		const data = await club(clubId);
		writeClub(clubId, data);
	}

	for (const userId of config.users) {
		const data = await user(userId);
		writeUser(userId, data);
	}

	setTimeout(cycle, time);
};

module.exports = {
	connect,
	cycle
};