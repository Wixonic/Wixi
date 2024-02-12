const Command = require("../command");
const console = require("../console");

module.exports = new Command({
	name: "reload",
	description: "Reloads the local list of commands.",
	type: 0,

	log: () => {
		console.info("Reloading commands");
		Command.update();
	}
});