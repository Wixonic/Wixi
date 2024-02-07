const fs = require("fs");
const path = require("path");

const { info, log, warn } = require("./console");
const { app, router } = require("./website");

const init = () => {
	const folderPath = path.join(__dirname, "plugins");
	const pluginFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"));

	let started = 0;

	for (const file of pluginFiles) {
		const filePath = path.join(folderPath, file);
		const plugin = require(filePath);

		if ("start" in plugin) {
			plugin.start(app, router);

			log(`Plugin started at ./${path.relative(folderPath, filePath)}`);
			started++;
		} else warn(`The plugin at ./${path.relative(folderPath, filePath)} is missing a required "start" property.`);
	}

	info(`${started}/${pluginFiles.length} plugins started`);
};

module.exports = {
	init
};