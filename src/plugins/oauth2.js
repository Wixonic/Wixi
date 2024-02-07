const fs = require("fs");
const https = require("https");
const path = require("path");

const config = require("../config");
const { error } = require("../console");
const { User } = require("../user");

module.exports = {
	start: (_, router) => {
		router.get("/oauth2/authorize", (req, res) => {
			const url = new URL(req.url, config.website.host);

			if (url.searchParams.has("code") && url.searchParams.has("state") && url.searchParams.get("state").split(config.discord.oauth2.state).length == 2 && url.searchParams.get("state").split(config.discord.oauth2.state)[0] == "") {
				try {
					redirect_url = new URL(decodeURIComponent(url.searchParams.get("state").split(config.discord.oauth2.state)[1]));
				} catch {
					const message = "Invalid redirect url";
					error(`Failed to authorize: ${message} (state: ${url.searchParams.get("state")})`);
					res.status(500).send(message);
					return;
				}

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

										redirect_url.searchParams.set("uid", user.id);
										redirect_url.searchParams.set("key", key);

										res.setHeader("location", redirect_url.href).sendStatus(308);
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
							error(`${message}: ${e} `);
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
	}
};