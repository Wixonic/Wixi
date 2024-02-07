const config = require("../config");
const { info } = require("../console");

module.exports = {
	start: (_, router) => {
		router.get("/authorize", (req, res) => {
			const url = new URL(req.url, config.website.host);

			const authParams = new URLSearchParams({
				client_id: config.discord.clientId,
				prompt: "none",
				redirect_uri: new URL("/oauth2/authorize", config.website.host).href,
				response_type: "code",
				scope: config.discord.oauth2.scopes.join(" "),
				state: config.discord.oauth2.state + (url.searchParams.get("redirect_url") ?? encodeURIComponent(config.website.host))
			});

			res.setHeader("location", `https://discord.com/oauth2/authorize?${authParams.toString()}`).sendStatus(307);

			info(`${res.socket?.remoteAddress ?? "Unknow IP"} - Redirected to Discord OAuth2`);
		});
	}
};