const clientManager = require("../client");
const { Extension } = require("../extension");
const request = require("../request");

const config = require("../config");

const cycle = async () => {
	const response = await request({
		body: JSON.stringify({
			userIds: [
				config.extensions.roblox.id
			]
		}),
		headers: {
			"accept": "application/json",
			"content-type": "application/json",
			"cookie": ".ROBLOSECURITY=" + config.extensions.roblox.token
		},
		method: "POST",
		type: "json",
		url: config.extensions.roblox.endpoints.presence
	});

	const presence = response?.userPresences?.at(0) ?? {
		userPresenceType: 0
	};

	switch (presence.userPresenceType) {
		case 1: // Online
			clientManager.addActivity("roblox", {
				name: "experiences",
				details: "Watching experiences",
				state: "On " + presence.lastLocation,

				assets: {
					small_image: config.assets.logo_roblox,
					small_text: "Roblox"
				},

				buttons: [
					"Open my profile"
				],

				metadata: {
					button_urls: [
						"https://www.roblox.com/users/" + config.extensions.roblox.id
					]
				},

				type: 3 // WATCHING
			});
			break;

		case 2: // InGame
			clientManager.addActivity("roblox", {
				name: presence.lastLocation,
				details: "Playing on Roblox",

				assets: {
					large_image: config.assets["roblox_experience_" + presence.universeId],
					large_text: presence.lastLocation,
					small_image: config.assets.logo_roblox,
					small_text: "Roblox"
				},

				timestamps: {
					start: new Date(presence.lastOnline).getTime()
				},

				buttons: [
					"Play",
					"Open my profile"
				],

				metadata: {
					button_urls: [
						"https://www.roblox.com/games/" + presence.rootPlaceId,
						"https://www.roblox.com/users/" + config.extensions.roblox.id
					]
				},

				type: 0 // PLAYING
			});
			break;

		case 3: // InStudio
			clientManager.addActivity("roblox", {
				name: "Roblox Studio",

				assets: {
					small_image: config.assets.logo_roblox_studio,
					small_text: "Roblox Studio"
				},

				timestamps: {
					start: new Date(presence.lastOnline).getTime()
				},

				buttons: [
					"Open my profile"
				],

				metadata: {
					button_urls: [
						"https://www.roblox.com/users/" + config.extensions.roblox.id
					]
				},

				type: 0 // PLAYING
			});
			break;

		default:
			clientManager.removeActivity("roblox");
			break;
	};

	setTimeout(cycle, 15000);
};

cycle();

module.exports = new Extension("Roblox", "/roblox", null, null);