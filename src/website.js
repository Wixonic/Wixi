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
const roles = require("./files/roles");
const settings = require("./settings");

const app = express();
const router = express.Router();

const init = () => {
	roles.all = [];
	roles.checked = [];
	roles.check = (id) => roles.colors.includes(id) || roles.customization.find((role) => role.id == id) != undefined || roles.notification.find((role) => role.id == id) != undefined;

	guild().roles.cache.forEach((role) => {
		if (role.position > 0) {
			roles.all.push({
				color: role.hexColor,
				id: role.id,
				position: role.position,
				name: role.name
			});

			if (roles.check(role.id)) roles.checked.push(role.id);
		}
	});

	roles.all.sort((a, b) => b.position - a.position);

	http.createServer((req, res) => {
		res.writeHead(308, {
			"location": new URL(req.url, config.website.host).href
		}).end();

		log(`${res.socket?.remoteAddress ?? "Unknow IP"} - Redirected to https`);
	}).listen(config.website.http.port, () => info("Redirection server is ready"));

	const httpsServer = https.createServer({
		cert: fs.readFileSync("./SSL/wixonic.fr.cer"),
		key: fs.readFileSync("./SSL/wixonic.fr.private.key")
	}, app);

	const ioHandler = new io.Server(httpsServer, {
		serveClient: false
	});

	ioHandler.use(async (socket, next) => {
		if (socket) {
			const id = socket.handshake.auth.id;
			const key = socket.handshake.auth.key;

			if (id && key) {
				try {
					socket.user = await User.fromKey(id, key);

					setTimeout(() => {
						if (socket.connected) socket.disconnect(true);
					}, (socket.user?.token?.expiresIn ?? 0) * 1000);

					if (socket.user) {
						info(`${socket.client?.conn?.remoteAddress ?? "Unknow IP"} - Connected as ${socket.user.id}`);
						next();
						return;
					}
				} catch (e) {
					error(`${socket.client?.conn?.remoteAddress ?? "Unknow IP"} - ${e}`);
				}
			} else error(`${socket.client?.conn?.remoteAddress ?? "Unknow IP"} - Unauthorized`);
		} else error("Unknow IP - Socket is invalid, failed to connect");

		next(new Error(401));
	});

	ioHandler.on("connection", async (socket) => {
		try {
			let member = await guild().members.fetch({ user: socket.user.id, force: true });
			const user = await socket.user.request("/users/@me");

			const data = {
				avatar: user.avatar,
				displayName: user.global_name ?? user.username,
				id: user.id,
				roles: Array.from(member.roles.cache.keys()),
				username: user.username
			};

			const refreshRoles = async () => {
				member = await guild().members.fetch({ user: socket.user.id, force: true });
				data.roles = Array.from(member.roles.cache.keys());
			};

			socket.on("disconnect", () => info(`${socket.client?.conn?.remoteAddress ?? "Unknow IP"} - Disconnected`));

			socket.emit("data", data, roles);
			socket.on("data", () => socket.emit("data", data, roles));

			socket.on("role", async (id, bool) => {
				if (roles.check(id)) {
					if (!bool && member.roles.cache.has(id)) {
						await member.roles.remove(id);
						socket.user.info(`Removed role ${roles.all.find((role) => role.id == id).name}`);
					} else if (bool && !member.roles.cache.has(id)) {
						await member.roles.add(id);
						socket.user.info(`Added role ${roles.all.find((role) => role.id == id).name}`);
					}

					await refreshRoles();
					socket.emit("data", data, roles);
				}
			});

			socket.on("check", async () => {
				await socket.user.check(true);
				await refreshRoles();
				socket.emit("data", data, roles);
			});

			socket.on("unauthorize", () => {
				fs.rmSync(path.join(socket.user.folder, "key"));
				fs.rmSync(path.join(socket.user.folder, "token.json"));
				socket.disconnect(true);
			});
		} catch (e) {
			error(`${socket?.client?.conn?.remoteAddress ?? "Unknow IP"} - Failed to connect: ${e}`);
			socket.disconnect(true);
		}
	});

	httpsServer.listen(config.website.port, () => info("Server is ready"));

	app.use(router);
	app.use((req, res) => {
		res.status(404).sendFile(path.join(__dirname, "/website/404.html"));
		warn(`${res.socket?.remoteAddress ?? "Unknow IP"} - 404: ${req.url}`);
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

		info(`${res.socket?.remoteAddress ?? "Unknow IP"} - Redirected to Discord OAuth2`);
	});

	router.get("/help", async (_, res) => {
		const channel = guild().channels.cache.get(settings.channels.help);
		res.setHeader("location", channel.url).sendStatus(307);
		info(`${res.socket?.remoteAddress ?? "Unknow IP"} - Redirected to #${channel.name}`);
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

								if (user?.token?.available) {
									const key = crypto.randomUUID();

									if (!fs.existsSync(path.join(User.folder(user.id)))) fs.mkdirSync(path.join(User.folder(user.id)), { recursive: true });
									fs.writeFileSync(path.join(User.folder(user.id), "key"), key, "ascii");

									res.setHeader("location", `/?uid=${user.id}&key=${key}`).sendStatus(308);
								} else {
									user.warn("Not in WixiLand, or the token is not available for some reason");
									res.setHeader("location", "https://go.wixonic.fr/discord").sendStatus(308);
								}
							} catch (e) {
								e = "Failed to initialize user - " + e;
								error(e);
								res.status(500).send(e);
							}
						}
					} catch (e) {
						const message = "Failed to parse accessTokenExchange";
						error(`${message}: ${e}`);
						res.status(500).send(message);
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

	router.get("/rules", async (_, res) => {
		res.setHeader("location", guild().rulesChannel.url).sendStatus(307);
		info(`${res.socket?.remoteAddress ?? "Unknow IP"} - Redirected to #${guild().rulesChannel.name}`);
	});

	router.use(express.static(config.website.path, {
		setHeaders: (res, filePath) => log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 2xx: ${path.join(config.website.path, path.relative(config.website.path, filePath))} `)
	}));
};

module.exports = {
	init
};