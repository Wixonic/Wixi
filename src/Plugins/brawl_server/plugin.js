const log = require("./log");
const request = require("./request");

const config = require("./config");

(async () => {
	const response = await request({
		headers: {
			accept: "application/json",
			authorization: `Bearer: ${config.token}`
		},
		method: "GET",
		type: "json",
		url: `https://api.brawlstars.com/v1/players/%23${config.profiles[0]}`
	});
})();