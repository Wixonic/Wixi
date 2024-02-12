const Command = require("../command");
const console = require("../console");

module.exports = new Command({
	name: "register",
	description: "Registers all commands in the local list to Discord.",
	type: 0,

	log: () => {
		console.info("Registering commands");
		Command.register();
	}
});