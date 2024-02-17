const fs = require("fs");
const path = require("path");

const config = require("./config");
const exec = require("../../exec");

const api = {
	data: {},
	interval: null,

	connect: (callback) => {
		api.interval = setInterval(async () => {
			try {
				const rawData = (await exec(`osascript ${path.join(__dirname.replace("app.asar", "app.asar.unpacked"), "api.applescript")}`)).split("-APISPLITTER-");

				let data = { state: rawData[0] };
				if (data.state == "playing") {
					data.name = rawData[1];
					data.artist = rawData[2];
					data.time = Number(rawData[3].replace(",", "."));
					data.duration = Number(rawData[4].replace(",", "."));
				}

				if (data.state != api.data.state || data.name != api.data.name || data.artist != api.data.artist) {
					if (data.state == "playing") {
						const folderPath = path.join(__dirname, config.cachePath, data.artist, data.name);
						const artworkPath = path.join(folderPath, "artwork.png");

						if (!fs.existsSync(artworkPath)) {
							if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
							await exec(`base64 -D <<<"$(osascript ${path.join(__dirname.replace("app.asar", "app.asar.unpacked"), "artwork.applescript")})" > "${artworkPath}"`);
						}
					}

					api.data = data;
					callback(data.state);
				}
			} catch (e) {
				console.error(e);
			}
		}, 1000);
	},

	disconnect: () => clearInterval(api.interval)
};

module.exports = api;