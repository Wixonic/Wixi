const { app, Menu, MenuItemConstructorOptions, Tray } = require("electron");
const { Router } = require("express");
const fs = require("fs");
const path = require("path");

const server = require("./server");
const { Package, Plugin } = require("./typedef");

/**
 * @type {Array<Package>}
 */
const plugins = [];
plugins.expectedLength = 0;

if (fs.existsSync(path.join(__dirname, "plugins"))) {
	for (const folder of fs.readdirSync(path.join(__dirname, "plugins"))) {
		plugins.expectedLength++;
		try {
			const package = require(path.join(__dirname, "plugins", folder, "package.json"));
			if (!package) throw "Plugin not found";

			try {
				/**
				 * @type {Plugin}
				 */
				const module = require(path.join(__dirname, "plugins", folder, package.main));
				plugins.push(module);
				server.use(module.serverPath, module.server());
				console.info(`Plugin "${package.displayName}" loaded successfully.`);
			} catch (e) {
				console.error(`Failed to load "${folder}": ${e.message}.`);
			}
		} catch {
			console.error(`Failed to load "${folder}" package data.`);
		}
	}
}

console.info(`Loaded ${plugins.length} out of ${plugins.expectedLength} plugins.`);


app.once("ready", () => {
	const tray = new Tray(path.join(__dirname, "assets", "tray.png"));

	/**
	 * @type {Array<MenuItemConstructorOptions>}
	 */
	const menuItems = [];
	for (const plugin of plugins) menuItems.push(...plugin.menu);

	menuItems.push({
		label: "Quit",
		type: "normal",
		click: () => app.quit()
	});

	tray.setContextMenu(Menu.buildFromTemplate(menuItems));
	tray.setToolTip(app.getName());

	app.dock.hide();
});