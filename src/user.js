const fs = require("fs");
const path = require("path");
const https = require("https");

const { guild } = require("./client");
const config = require("./config");
const { log } = require("./console");
const { info } = require("console");

const request = (token, endpoint = "/users/@me", method = "GET", params) => new Promise(async (resolve, reject) => {
	if (token && token.available) {
		try {
			if (Date.now() > token.expiresAt) await token.refresh();
		} catch {
			reject("Failed to refresh token");
		}

		const req = https.request(new URL(path.join("/api/v10", endpoint), "https://discord.com"), {
			headers: {
				"authorization": `${token.type} ${token.value}`,
				"content-type": "application/json"
			},
			method
		}, (res) => {
			let chunks = "";

			res.on("data", (chunk) => chunks += chunk);
			res.on("end", () => {
				try {
					const response = JSON.parse(chunks);

					if (response.message == null) resolve(response)
					else reject(response.message);
				} catch {
					reject("Failed to parse response");
				}
			});
		});

		if (params) req.write(JSON.stringify(params));
		req.end();
	} else reject("Revoked");
});

class Token {
	static fromAccessTokenExchange = (accessTokenExchange) => new Token(accessTokenExchange.token_type, accessTokenExchange.access_token, accessTokenExchange.refresh_token, Date.now() + accessTokenExchange.expires_in, accessTokenExchange.scope.split(" "));

	static fromFile = (userId) => {
		const file = `./database/users/${userId}/token.json`;

		if (fs.existsSync(file)) {
			const token = JSON.parse(fs.readFileSync(file, { encoding: "utf-8" }));
			if (token) return new Token(token.type, token.value, token.refreshToken, token.expiresAt, token.scopes);
			else return null;
		} else return null;
	};

	constructor(type, value, refreshToken, expiresAt, scopes) {
		this.available = true;

		this.type = type;
		this.value = value;
		this.refreshToken = refreshToken;
		this.expiresAt = expiresAt;
		this.scopes = scopes;
	};

	refresh = () => new Promise((resolve, reject) => {
		const request = https.request("https://discord.com/api/v10/oauth2/token", {
			auth: `${config.discord.clientId}: ${config.discord.clientSecret}`,
			headers: {
				"content-type": "application/x-www-form-urlencoded"
			},
			method: "POST"
		}, (response) => {
			let chunks = "";

			response.on("data", (chunk) => chunks += chunk);
			response.on("end", () => {
				try {
					const accessTokenExchange = JSON.parse(chunks);

					if (accessTokenExchange.error) reject(accessTokenExchange.error + " " + accessTokenExchange.error_description);
					else {
						this.type = accessTokenExchange.token_type;
						this.value = accessTokenExchange.access_token;
						this.refreshToken = accessTokenExchange.refresh_token;
						this.expiresAt = Date.now() + accessTokenExchange.expires_in;
						this.scopes = accessTokenExchange.scope.split(" ");

						resolve(this);
					}
				} catch {
					reject("Failed to parse accessTokenExchange");
				}
			});
		});

		request.write(new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: this.refreshToken
		}).toString());

		request.end();
	});

	revoke = () => new Promise((resolve) => {
		const request = https.request("https://discord.com/api/v10/oauth2/token/revoke", {
			auth: `${config.discord.clientId}: ${config.discord.clientSecret}`,
			headers: {
				"content-type": "application/x-www-form-urlencoded"
			},
			method: "POST"
		}, () => {
			this.available = false;
			resolve();
		});

		request.write(new URLSearchParams({
			token: this.refreshToken,
			token_type_hint: "refresh_token"
		}).toString());

		request.end();
	});
};

class User {
	static async fromAccessTokenExchange(accessTokenExchange) {
		const token = Token.fromAccessTokenExchange(accessTokenExchange);

		if (token) {
			const me = await request(token, "/users/@me");

			if (me && me.id) {
				const user = new User(me.id, token);
				await user.check();

				return user;
			}
		}

		return null;
	};

	static async fromFile(userId) {
		const token = Token.fromFile(userId);

		if (token) {
			const user = new User(userId, token);
			await user.check(true);

			return user;
		}

		return null;
	};

	constructor(id, token) {
		this.id = id;

		this.token = token;

		const datas = this.recoverData();
		this.checked = datas.checked ?? 0;

		this.saveData();
		this.saveToken();
	};

	get folder() {
		return `./database/users/${this.id}/`;
	};

	// Check if checked more than one day ago or if force is true
	async check(force = false) {
		if (this.checked < Date.now() - 1000 * 60 * 60 * 12 || force) {
			const member = await guild().members.fetch(this.id);

			const connections = await this.request("/users/@me/connections");
			const guilds = await this.request("/users/@me/guilds");

			const roles = {
				developer: connections.find((connection) => connection.type == "github" && connection.verified),
				gamer: connections.find((connection) => ["battlenet", "epicgames", "leagueoflegends", "playstation", "riotgames", "steam", "xbox"].includes(connection.type) && connection.verified),
				w47k3r5: guilds.find((guild) => guild.id == config.discord.guilds.wow)
			};

			if (!member.roles.cache.has(config.discord.roles.developer) && roles.developer) {
				member.roles.add(config.discord.roles.developer);
				this.info("Added role Developer");
			} else if (member.roles.cache.has(config.discord.roles.developer) && !roles.developer) {
				member.roles.remove(config.discord.roles.developer);
				this.warn("Removed role Developer");
			}

			if (!member.roles.cache.has(config.discord.roles.gamer) && roles.gamer) {
				member.roles.add(config.discord.roles.gamer);
				this.info("Added role Gamer");
			} else if (member.roles.cache.has(config.discord.roles.gamer) && !roles.gamer) {
				member.roles.remove(config.discord.roles.gamer);
				this.warn("Removed role Gamer");
			}

			if (!member.roles.cache.has(config.discord.roles.w47k3r5) && roles.w47k3r5) {
				member.roles.add(config.discord.roles.w47k3r5);
				this.info("Added role w47k3r5");
			} else if (member.roles.cache.has(config.discord.roles.w47k3r5) && !roles.w47k3r5) {
				member.roles.remove(config.discord.roles.w47k3r5);
				this.warn("Removed role w47k3r5");
			}

			if (config.discord.roles.verified && !member.roles.cache.has(config.discord.roles.verified)) {
				await member.roles.add(config.discord.roles.verified);
				this.info("Added role Verified");
			}

			this.checked = Date.now();
			this.saveData();
		}
	};

	recoverData() {
		const file = path.join(this.folder, "user.json");

		if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, { encoding: "utf-8" }));
		else return {};
	};

	request = (endpoint, method, params) => request(this.token, endpoint, method, params);

	saveData() {
		if (!fs.existsSync(this.folder)) fs.mkdirSync(this.folder, { recursive: true });

		const data = {};
		Object.assign(data, this);
		delete data.token;

		fs.writeFileSync(path.join(this.folder, "user.json"), JSON.stringify(data));

		this.log("Saved datas");
	};

	saveToken() {
		if (!fs.existsSync(this.folder)) fs.mkdirSync(this.folder, { recursive: true });
		fs.writeFileSync(path.join(this.folder, "token.json"), JSON.stringify(this.token));

		this.log("Saved token");
	};

	error = (text) => error(`${this.id} - ${text}`);
	info = (text) => info(`${this.id} - ${text}`);
	log = (text) => log(`${this.id} - ${text}`);
	warn = (text) => warn(`${this.id} - ${text}`);
};

module.exports = {
	request,
	Token,
	User
};