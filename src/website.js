const express = require("express");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const io = require("socket.io");

const { guild } = require("./client");
const { error, info, log, warn } = require("./console");
const { User } = require("./user");

const config = require("./config");

const app = express();
const router = express.Router();

const init = () => {
	http.createServer((req, res) => {
		res.writeHead(308, {
			"location": new URL(req.url, config.website.host).href
		}).end();

		log(`${res.socket.remoteAddress} - Redirected to https`);
	}).listen(config.website.http.port, () => info("Redirection server is ready"));

	const httpsServer = https.createServer({
		cert: fs.readFileSync("./SSL/wixonic.fr.cer"),
		key: fs.readFileSync("./SSL/wixonic.fr.private.key")
	}, app);

	const ioHandler = new io.Server(httpsServer, {
		serveClient: false
	});

	ioHandler.use(async (socket, next) => {
		const id = socket.handshake.auth.id;
		const key = socket.handshake.auth.key;

		if (id && key) {
			try {
				socket.user = await User.fromKey(id, key);

				if (socket.user) {
					log(`${socket.client.conn.remoteAddress} - Connected`);
					next();
					return;
				}
			} catch (e) {
				error(`${socket.client.conn.remoteAddress} - ${e}`);
			}
		}

		log(`${socket.client.conn.remoteAddress} - Unauthorized`);
		next(new Error(401));
	});

	ioHandler.on("connection", async (socket) => {
		try {
			const user = await socket.user.request("/users/@me");

			const data = {
				avatar: user.avatar,
				displayName: user.global_name ?? user.username,
				id: user.id,
				username: user.username
			};

			socket.emit("data", data);
			socket.on("data", () => socket.emit("data", data));
		} catch (e) {
			error(`${socket.client.conn.remoteAddress} - ${e}`);
			socket.disconnect();
		}
	});

	httpsServer.listen(config.website.port, () => info("Server is ready"));

	app.use(router);
	app.use((req, res) => {
		res.status(404).send(`Wow that thing doesn't exist! Let's start again from the <a href="${config.website.host}">homepage</a>.`);
		warn(`${res.socket.remoteAddress} - 404: ${req.url}`);
	});

	router.get("/rules", async (_, res) => {
		res.setHeader("location", guild().rulesChannel.url).sendStatus(307);
		info(`${res.socket.remoteAddress} - Redirected to #${guild().rulesChannel.name}`);
	});

	router.get("/help", async (_, res) => {
		const channel = guild().channels.cache.get(config.discord.channels.help);
		res.setHeader("location", channel.url).sendStatus(307);
		info(`${res.socket.remoteAddress} - Redirected to #${channel.name}`);
	});

	router.get("/authorize", (_, res) => {
		const authParams = new URLSearchParams({
			client_id: config.discord.clientId,
			prompt: "none",
			redirect_uri: new URL("/oauth2/authorize", config.website.host).href,
			response_type: "code",
			scope: config.discord.oauth2.scopes,
			state: config.discord.oauth2.state
		});

		res.setHeader("location", `https://discord.com/oauth2/authorize?${authParams.toString()}`).sendStatus(307);

		info(`${res.socket.remoteAddress} - Redirected to Discord OAuth2`);
	});

	router.get("/oauth2/authorize", (req, res) => {
		const url = new URL(req.url, config.website.host);

		if (url.searchParams.has("code") && url.searchParams.has("state") && url.searchParams.get("state") == config.discord.oauth2.state) {
			const request = https.request("https://discord.com/api/v10/oauth2/token", {
				auth: `${config.discord.clientId}:${config.discord.clientSecret}`,
				headers: {
					"content-type": "application/x-www-form-urlencoded"
				},
				method: "POST"
			}, (response) => {
				let chunks = "";

				response.on("data", (chunk) => chunks += chunk);
				response.on("end", async () => {
					try {
						const accessTokenExchange = JSON.parse(chunks);

						if (accessTokenExchange.error) {
							const e = accessTokenExchange.error + " " + accessTokenExchange.error_description;

							error(e);
							res.status(500).send(e);
						} else {
							try {
								const user = await User.fromAccessTokenExchange(accessTokenExchange);
								const key = crypto.randomUUID();

								if (!fs.existsSync(path.join(User.folder(user.id)))) fs.mkdirSync(path.join(User.folder(user.id)), { recursive: true });
								fs.writeFileSync(path.join(User.folder(user.id), "key"), key, { encoding: "ascii" });
								log(`${user.id} - Saved key`);

								res.setHeader("location", `/?uid=${user.id}&key=${key}`).sendStatus(308);
							} catch (e) {
								e = "Failed to initialize user - " + e;

								error(e);
								res.status(500).send(e);
							}
						}
					} catch {
						const e = "Failed to parse accessTokenExchange";

						error(e);
						res.status(500).send(e);
					}
				});
			});

			request.write(new URLSearchParams({
				code: url.searchParams.get("code"),
				grant_type: "authorization_code",
				redirect_uri: new URL("/oauth2/authorize", config.website.host).href
			}).toString());

			request.end();
		} else res.sendStatus(403);
	});

	router.use(express.static(config.website.path, {
		setHeaders: (res, filePath) => log(`${res.socket.remoteAddress} - 2xx: ${path.join(config.website.path, path.relative(config.website.path, filePath))} `)
	}));
};

module.exports = {
	init
};