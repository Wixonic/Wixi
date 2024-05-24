const clientManager = require("../client");
const { Extension } = require("../extension");
const request = require("../request");

const config = require("../config");

const cycle = async () => {
	const url = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002");

	url.searchParams.set("key", config.extensions.steam.token);
	url.searchParams.set("steamids", config.extensions.steam.id);

	const response = (await request({
		method: "GET",
		type: "json",
		url
	})).response ?? {};

	const player = response?.players?.at(0) ?? {};

	if (player.gameid) {
		const url = new URL("https://store.steampowered.com/api/appdetails");

		url.searchParams.set("appids", player.gameid);
		url.searchParams.set("key", config.extensions.steam.token);

		const response = (await request({
			method: "GET",
			type: "json",
			url
		})) ?? {};

		const game = response[player.gameid]?.data ?? {};

		if (response[player.gameid]?.success) {
			clientManager.addActivity("steam", {
				name: game.name,
				details: "Playing on Steam",

				assets: {
					large_image: config.assets["steam_game_" + player.gameid],
					large_text: game.name,
					small_image: config.assets.logo_steam,
					small_text: "Steam"
				},

				buttons: [
					"Play",
					"Open my profile"
				],

				metadata: {
					button_urls: [
						"https://store.steampowered.com/app/" + player.gameid,
						player.profileurl
					]
				},

				type: 0 // PLAYING
			});

		} else clientManager.removeActivity("steam");
	} else clientManager.removeActivity("steam");

	setTimeout(cycle, 15000);
};

cycle();

module.exports = new Extension("Steam", "/steam", null, null);