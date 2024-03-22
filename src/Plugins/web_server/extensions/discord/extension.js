const { Collection, MessageFlags } = require("discord.js");
const express = require("express");
const fs = require("fs");
const https = require("https");
const path = require("path");

const { client, guild, defaultActivity } = require("./client");
const log = require("../../log");
const { User } = require("./user");

const config = require("./config");
const roles = require("./files/roles");
const settings = require("./settings");

module.exports = (router, io, extensionPath) => {
	router.get("/authorize", (req, res) => {
		const url = new URL(req.url, "https://server.wixonic.fr");

		const authParams = new URLSearchParams({
			client_id: config.clientId,
			prompt: "none",
			redirect_uri: `https://server.wixonic.fr/${extensionPath}/oauth2/authorize`,
			response_type: "code",
			scope: config.oauth2.scopes.join(" "),
			state: config.oauth2.state + (url.searchParams.get("redirect_url") ?? encodeURIComponent(`https://server.wixonic.fr/${extensionPath}`))
		});

		res.setHeader("location", `https://discord.com/oauth2/authorize?${authParams.toString()}`).sendStatus(307);

		log(`${res.socket?.remoteAddress ?? "Unknow IP"} - Redirected to Discord OAuth2`);
	});

	router.get("/help", async (_, res) => {
		const channel = guild().channels.cache.get(settings.channels.help);
		res.setHeader("location", channel.url).sendStatus(307);
		log(`${res.socket?.remoteAddress ?? "Unknow IP"} - Redirected to #${channel.name}`);
	});

	router.get("/oauth2/authorize", (req, res) => {
		const url = new URL(req.url, "https://server.wixonic.fr");

		if (url.searchParams.has("code") && url.searchParams.has("state") && url.searchParams.get("state").startsWith(config.oauth2.state)) {
			try {
				redirect_url = new URL(decodeURIComponent(url.searchParams.get("state").split(config.oauth2.state)[1]), `https://server.wixonic.fr/${extensionPath}`);
			} catch (e) {
				console.log(e)
				const message = "Invalid redirect url";
				log(`Failed to authorize: ${message} (state: ${url.searchParams.get("state")})`);
				res.status(500).send(message);
				return;
			}

			const request = https.request("https://discord.com/api/v10/oauth2/token", {
				auth: `${config.clientId}:${config.clientSecret}`,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				method: "POST"
			}, (response) => {
				let chunks = "";

				response.on("data", (chunk) => chunks += chunk);
				response.on("end", async () => {
					try {
						const accessTokenExchange = JSON.parse(chunks);

						if (accessTokenExchange.error) {
							const e = accessTokenExchange.error + " " + accessTokenExchange.error_description ?? "no description";

							log(e);
							res.status(500).send(e);
						} else {
							try {
								const user = await User.fromAccessTokenExchange(accessTokenExchange);

								if (user?.token?.available) {
									const key = crypto.randomUUID();

									if (!fs.existsSync(path.join(User.folder(user.id)))) fs.mkdirSync(path.join(User.folder(user.id)), { recursive: true });
									fs.writeFileSync(path.join(User.folder(user.id), "key"), key, "ascii");

									redirect_url.searchParams.set("uid", user.id);
									redirect_url.searchParams.set("key", key);

									res.setHeader("location", redirect_url.href).sendStatus(308);
								} else {
									user.log("Not in WixiLand, or the token is not available for some reason");
									res.setHeader("location", "https://go.wixonic.fr/discord").sendStatus(308);
								}
							} catch (e) {
								e = "Failed to initialize user - " + e;
								log(e);
								res.status(500).send(e);
							}
						}
					} catch (e) {
						const message = "Failed to parse accessTokenExchange";
						log(`${message}: ${e}`);
						res.status(500).send(message);
					}
				});
			});

			request.write(new URLSearchParams({
				code: url.searchParams.get("code"),
				grant_type: "authorization_code",
				redirect_uri: new URL("/discord/oauth2/authorize", "https://server.wixonic.fr").href
			}).toString());

			request.end();
		} else res.sendStatus(403);
	});


	client.commands = new Collection();

	client.once("ready", async () => {
		const guild = await client.guilds.fetch(settings.guild);

		let after = null;

		for (let x = 0; x < Math.ceil(guild.memberCount / 1000); ++x) {
			const list = await guild.members.list({
				after: after
			});

			list.forEach(async (member) => {
				after = member.id;

				const user = await User.fromFile(member.id);
				if (user) await user.check();
			});
		}

		if (fs.existsSync(path.join(__dirname, "/files/rules.md"))) {
			const rules = fs.readFileSync(path.join(__dirname, "/files/rules.md"), "utf-8");

			const message = (await guild.rulesChannel.messages.fetch({
				limit: 1
			})).at(0);

			const content = {
				content: rules,
				components: [
					{
						type: 1,
						components: [
							{
								type: 2,
								label: `Verify your account`,
								url: settings.rules.url,
								style: 5
							}
						]
					}
				],
				flags: settings.rules.silent ? MessageFlags.SuppressNotifications : null
			};

			if (message && (message.content != rules || settings.rules.force)) {
				await guild.rulesChannel.messages.delete(message.id);
				await guild.rulesChannel.send(content);

				log("Updated rules")
			} else if (!message || settings.rules.force) {
				await guild.rulesChannel.send(content);

				log("Added rules")
			}
		}


		const foldersPath = path.join(__dirname, "commands");
		const commandFolders = fs.readdirSync(foldersPath);

		let started = 0;
		let totalCommands = 0;

		for (const folder of commandFolders) {
			const commandsPath = path.join(foldersPath, folder);
			const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

			totalCommands += commandFiles.length;

			for (const file of commandFiles) {
				const filePath = path.join(commandsPath, file);
				const command = require(filePath);

				if ("data" in command && "execute" in command) {
					client.commands.set(command.data.name, command);
					if ("plugin" in command) command.plugin(router);

					log(`Command started at /${path.relative(foldersPath, filePath)}`);
					started++;
				} else log(`The command at /${path.relative(foldersPath, filePath)} is missing a required "data" or "execute" property.`);
			}
		}

		log(`${started}/${totalCommands} commands started`);


		client.on("interactionCreate", async (interaction) => {
			if (interaction.isChatInputCommand()) {
				interaction.log = (text) => log(`${interaction.user.displayName} - ${text}`);

				interaction.safeReply = async (reply) => {
					if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
					else await interaction.reply(reply);
				};

				const command = interaction.client.commands.get(interaction.commandName);

				if (command) {
					try {
						interaction.log(interaction.toString());
						await command.execute(interaction);
					} catch (e) {
						interaction.log(e);

						await interaction.safeReply({ content: "There was an error while executing this command.", ephemeral: true, allowedMentions: { repliedUser: false } });
					}
				} else {
					const e = `No command matching "${interaction.commandName}" was found.`;
					interaction.log(e);
					await interaction.safeReply({ content: e, ephemeral: true, allowedMentions: { repliedUser: false } });
				}
			}
		});

		log("Text-command interaction handler ready");

		roles.all = [];
		roles.checked = [];
		roles.check = (id) => roles.colors.includes(id) || roles.customization.find((role) => role.id == id) != undefined || roles.notification.find((role) => role.id == id) != undefined;

		guild.roles.cache.forEach((role) => {
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

		io.use(async (socket, next) => {
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
					log(`${socket.username ?? socket.client?.conn?.remoteAddress ?? "Unknow IP"} - ${e}`);
				}
			} else log(`${socket.client?.conn?.remoteAddress ?? "Unknow IP"} - Unauthorized`);

			next(new Error(401));
		});

		io.on("connection", async (socket) => {
			try {
				let member = await guild.members.fetch({ user: socket.user.id, force: true });
				const user = await socket.user.request("/users/@me");

				const data = {
					avatar: user.avatar,
					displayName: user.global_name ?? user.username,
					id: user.id,
					roles: Array.from(member.roles.cache.keys()),
					username: user.username
				};

				const refreshRoles = async () => {
					member = await guild.members.fetch({ user: socket.user.id, force: true });
					data.roles = Array.from(member.roles.cache.keys());
				};

				log(`${socket?.username ?? "Unknow"} - Connected from "${socket.handshake.auth?.page ?? "unknown page"}"`);

				socket.on("disconnect", async () => log(`${socket?.username ?? "Unknow"} - Disconnected from "${socket.handshake.auth?.page ?? "unknown page"}"`));

				socket.emit("data", data, roles);
				socket.on("data", () => socket.emit("data", data, roles));

				socket.on("role", async (id, bool) => {
					if (bool && roles.colors.includes(id)) {
						for (const colorRole of roles.colors) {
							if (id != colorRole && data.roles.includes(colorRole)) {
								await member.roles.remove(colorRole);
								socket.user.log(`Removed role ${roles.all.find((role) => role.id == colorRole).name} `);
							}
						}
					}

					if (roles.check(id)) {
						if (!bool && data.roles.includes(id)) {
							await member.roles.remove(id);
							socket.user.log(`Removed role ${roles.all.find((role) => role.id == id).name} `);
						} else if (bool && !data.roles.includes(id)) {
							await member.roles.add(id);
							socket.user.log(`Added role ${roles.all.find((role) => role.id == id).name} `);
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
				log(`${socket?.username ?? "Unknow"} - Failed to connect from "${socket.handshake.auth?.page ?? "unknown page"}": ${e} `);
				socket.disconnect(true);
			}
		});

		router.use(express.static(path.join(__dirname, "website"), {
			setHeaders: (res, filePath) => log(`${res.socket?.remoteAddress ?? "Unknow IP"} - 2xx: /${extensionPath}/${path.relative(__dirname, filePath)} `)
		}));


		client.user.setActivity(defaultActivity);

		log(`Bot ${client.user.displayName} is now online`);
	});
};