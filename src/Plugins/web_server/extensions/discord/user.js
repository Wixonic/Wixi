const fs = require("fs");
const path = require("path");
const https = require("https");

const { guild } = require("./client");
const log = require("./log");

const settings = require("./settings");
const config = require("./config");

const request = (token, endpoint = "/users/@me", method = "GET", params) => new Promise(async (resolve, reject) => {
	if (token && token.available && token.expiresAt > Date.now()) {
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
	static fromAccessTokenExchange = (accessTokenExchange) => new Token(true, accessTokenExchange.token_type, accessTokenExchange.access_token, accessTokenExchange.refresh_token, Date.now() + accessTokenExchange.expires_in, accessTokenExchange.scope.split(" "));

	static fromFile = (userId) => {
		const file = path.join(User.folder(userId), "token.json");

		if (fs.existsSync(file)) {
			const token = JSON.parse(fs.readFileSync(file, "utf-8"));
			if (token) return new Token(token.available, token.type, token.value, token.refreshToken, token.expiresAt, token.scopes);
			else return null;
		} else return null;
	};

	constructor(available, type, value, refreshToken, expiresAt, scopes) {
		this.type = type;
		this.value = value;
		this.refreshToken = refreshToken;
		this.expiresAt = expiresAt;
		this.expiresIn = expiresAt - Date.now();
		this.scopes = scopes;

		this.available = available && this.expiresIn > 0;
	};
};

class User {
	static getName = async (userId) => {
		let member = guild().members.cache.get(userId);

		try {
			member = await guild().members.fetch(userId);
		} catch { }

		if (member) {
			if (member.nickname) return `${member.nickname} (${member.user.username})`;
			else {
				if (member.user.displayName != member.user.username) return `${member.displayName} (${member.user.username})`;
				else return member.displayName;
			}
		} else return userId;
	};

	static getCachedName = (userId) => {
		let member = guild().members.cache.get(userId);

		if (member) {
			if (member.nickname) return `${member.nickname} (${member.user.username})`;
			else {
				if (member.user.displayName != member.user.username) return `${member.displayName} (${member.user.username})`;
				else return member.displayName;
			}
		} else return userId;
	};

	static folder = (userId) => path.join(config.root, `/users/${userId}/`);

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
			return user;
		}

		return null;
	};

	static async fromKey(userId, userKey) {
		const file = path.join(User.folder(userId), "key");

		if (fs.existsSync(file)) {
			const dbKey = fs.readFileSync(file, "ascii");
			if (dbKey == userKey) return await User.fromFile(userId);
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
		return User.folder(this.id);
	};

	// Check if checked more than one day ago or if force is true
	async check(force = false) {
		if (this.checked < Date.now() - 1000 * 60 * 60 * 12 || force) {
			try {
				const member = await guild().members.fetch(this.id, { force: true });

				const connections = await this.request("/users/@me/connections");
				const guilds = await this.request("/users/@me/guilds");

				const roles = {
					cc: connections.find((connection) => ["twitch", "youtube"].includes(connection.type) && connection.verified),
					developer: connections.find((connection) => connection.type == "github" && connection.verified),
					gamer: (connections.find((connection) => ["battlenet", "epicgames", "leagueoflegends", "playstation", "riotgames", "steam", "xbox"].includes(connection.type) && connection.verified) || member.roles.cache.hasAny([settings.roles.minecraft, settings.roles.roblox])),
					w47k3r5: guilds.find((guild) => guild.id == settings.guilds.wow)
				};

				if (!member.roles.cache.has(settings.roles.developer) && roles.developer) {
					await member.roles.add(settings.roles.developer);
					this.log("Added role Developer");
				} else if (member.roles.cache.has(settings.roles.developer) && !roles.developer) {
					await member.roles.remove(settings.roles.developer);
					this.log("Removed role Developer");
				}

				if (!member.roles.cache.has(settings.roles.gamer) && roles.gamer) {
					await member.roles.add(settings.roles.gamer);
					this.log("Added role Gamer");
				} else if (member.roles.cache.has(settings.roles.gamer) && !roles.gamer) {
					await member.roles.remove(settings.roles.gamer);
					this.log("Removed role Gamer");
				}

				if (!member.roles.cache.has(settings.roles.w47k3r5) && roles.w47k3r5) {
					await member.roles.add(settings.roles.w47k3r5);
					this.log("Added role w47k3r5");
				} else if (member.roles.cache.has(settings.roles.w47k3r5) && !roles.w47k3r5) {
					await member.roles.remove(settings.roles.w47k3r5);
					this.log("Removed role w47k3r5");
				}

				if (!member.roles.cache.has(settings.roles.cc) && !member.roles.cache.has(settings.roles.verified) && roles.cc) {
					await member.roles.add(settings.roles.cc);
					this.log("Added role Content Creator");
				}

				if (settings.roles.verified && !member.roles.cache.has(settings.roles.verified)) {
					await member.roles.add(settings.roles.verified);
					this.log("Added role Verified");
				}

				this.checked = Date.now();
				this.saveData();

				return connections;
			} catch (e) {
				this.log(`Failed to check member: ${e}`);
				this.token.available = false;
				this.saveToken();
				return;
			}
		}
	};

	recoverData() {
		const file = path.join(this.folder, "user.json");

		if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8"));
		else return {};
	};

	request = (endpoint, method, params) => request(this.token, endpoint, method, params);

	saveData() {
		if (!fs.existsSync(this.folder)) fs.mkdirSync(this.folder, { recursive: true });

		const data = {};
		Object.assign(data, this);
		delete data.token;

		fs.writeFileSync(path.join(this.folder, "user.json"), JSON.stringify(data));
	};

	saveToken() {
		if (!fs.existsSync(this.folder)) fs.mkdirSync(this.folder, { recursive: true });
		fs.writeFileSync(path.join(this.folder, "token.json"), JSON.stringify(this.token));
	};

	log = (text) => log(`${User.getCachedName(this.id)} - ${text}`);
};

module.exports = {
	request,
	Token,
	User
};