const { Plugin } = require("../../typedef");

const RPC = require("discord-rpc");
const path = require("path");

const api = require("./api");
const config = require("./config");
const package = require("./package");
const { Router, static } = require("express");

/**
 * @type {Plugin}
 */
const plugin = {
	client: new RPC.Client({ transport: "ipc" }),

	connected: false,
	menu: [{
		checked: true,
		icon: path.join(__dirname, "assets", "tray.png"),
		label: package.displayName,
		type: "checkbox",

		click: async (menuItem) => {
			if (menuItem.checked) plugin.enable();
			else plugin.disable();
		}
	}],

	serverPath: config.serverPath,
	server: () => {
		const router = Router();
		router.use(static(path.join(__dirname, config.cachePath)));
		return router;
	},

	enable: async () => await plugin.connect(),
	disable: async () => await plugin.disconnect(),

	connect: async () => {
		if (!plugin.connected) {
			plugin.client.on("error", plugin.disconnect);
			plugin.client.on("disconnect", plugin.disconnect);

			plugin.client.on("ready", () => {
				api.connect(async (state) => {
					if (state == "playing") {
						await plugin.client.setActivity({
							smallImageKey: "app",
							smallImageText: package.displayName,
							details: api.data.name,
							state: api.data.artist,
							largeImageKey: new URL(path.join(config.serverPath, api.data.artist, api.data.name, "artwork.png"), config.host).href,
							largeImageText: `${api.data.name} by ${api.data.artist}`,

							startTimestamp: Math.floor(Date.now() - api.data.time * 1000)
						});
					} else await plugin.client.clearActivity();
				})
			});

			plugin.connected = true;
			await plugin.client.login({ clientId: config.clientId });
		}
	},

	disconnect: async () => {
		api.disconnect();
		await plugin.client.clearActivity();
		await plugin.client.destroy();
		plugin.client = new RPC.Client({ transport: "ipc" });
		plugin.connected = false;
	}
};

plugin.enable();

module.exports = plugin;