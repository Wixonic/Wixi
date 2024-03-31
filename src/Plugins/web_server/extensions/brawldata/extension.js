const { cycle } = require("./cycle");
const log = require("./log");

const config = require("./config");

module.exports = async (router, io) => {
	await cycle(3600 / 4 * 1000); // Every 15 minutes
};