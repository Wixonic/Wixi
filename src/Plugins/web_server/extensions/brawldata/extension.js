const fs = require("fs");

const { cycle } = require("./cycle");
const log = require("./log");

const config = require("./config");

const root = path.join(__dirname, "database");

module.exports = async (router, io) => {
	router.get("/api", (_, res) => {});
	
	router.get("/api/brawlers", (_, res) => {
		const file = path.join(root, "brawlers.json");

		if (fs.existsSync(file)) res.writeHead(200).write(fs.readFileSync(file)).end();
		else res.writeHead(404).end();
	});
	
	router.get("/api/users", (_, res) => {
		const folder = path.join(root, "users");

		if (fs.existsSync(file)) res.writeHead(200).write(JSON.stringify(fs.readdirSync(folder), null, 4)).end();
		else res.writeHead(404).end();
	});
	
	router.get("/api/users/:id", (req, res) => {
		const file = path.join(root, "users", req.params.id, "latest.json");

		if (fs.existsSync(file)) res.writeHead(200).write(fs.readFileSync(file)).end();
		else res.writeHead(404).end();
	});
	
	router.get("/api/users/:id/stats", (res, res) => {
		const file = path.join(root, "users", req.params.id, "stats.json");

		if (fs.existsSync(file)) res.writeHead(200).write(fs.readFileSync(file)).end();
		else res.writeHead(404).end();
	});
	
	await cycle(3600 / 4 * 1000); // Every 15 minutes
};