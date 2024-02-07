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
		const id = socket.handshake.auth?.id;
		const key = socket.handshake.auth?.key;

		if (id && key) {
			try {
				socket.username = await User.getName(id);
				socket.user = await User.fromKey(id, key);

				if (socket.user) {
					setTimeout(() => {
						if (socket.connected) socket.disconnect(true);
					}, (socket.user.token.expiresIn ?? 0) * 1000);

					log(`${socket.username} - Try to connect from ${socket.client?.conn?.remoteAddress ?? "unknow IP"}`);
					next();
					return;
				}
			} catch (e) {
				error(`${socket.username ?? socket.client?.conn?.remoteAddress ?? "Unknow IP"} - ${e}`);
			}
		} else error(`${socket.client?.conn?.remoteAddress ?? "Unknow IP"} - Unauthorized`);

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

			info(`${socket?.username ?? "Unknow"} - Connected from "${socket.handshake.auth?.page ?? "unknown page"}"`);

			socket.on("disconnect", async () => info(`${socket?.username ?? "Unknow"} - Disconnected from "${socket.handshake.auth?.page ?? "unknown page"}"`));

			socket.emit("data", data, roles);
			socket.on("data", () => socket.emit("data", data, roles));

			socket.on("role", async (id, bool) => {
				if (bool && roles.colors.includes(id)) {
					for (const colorRole of roles.colors) {
						if (id != colorRole && data.roles.includes(colorRole)) {
							await member.roles.remove(colorRole);
							socket.user.info(`Removed role ${roles.all.find((role) => role.id == colorRole).name}`);
						}
					}
				}

				if (roles.check(id)) {
					if (!bool && data.roles.includes(id)) {
						await member.roles.remove(id);
						socket.user.info(`Removed role ${roles.all.find((role) => role.id == id).name}`);
					} else if (bool && !data.roles.includes(id)) {
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
			error(`${socket?.username ?? "Unknow"} - Failed to connect from "${socket.handshake.auth?.page ?? "unknown page"}": ${e}`);
			socket.disconnect(true);
		}
	});

	httpsServer.listen(config.website.port, () => info("Server is ready"));

	app.use(router);
	app.use((req, res) => {
		res.status(404).sendFile(path.join(__dirname, "/website/404.html"));
		warn(`${res.socket?.remoteAddress ?? "Unknow IP"} - 404: ${req.url}`);
	});

	router.use(express.static(config.website.path, {
		setHeaders: (res, filePath) => log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 2xx: ${path.join(config.website.path, path.relative(config.website.path, filePath))} `)
	}));
};

module.exports = {
	app,
	init,
	router
};