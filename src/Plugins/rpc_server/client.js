const SelfBot = require("discord.js-selfbot-v13");

const { BaseObject } = require("./base");

class Client extends BaseObject {
	constructor() {
		super();

		this.selfbot = new SelfBot.Client();
	};
};

module.exports = {
	Client
};