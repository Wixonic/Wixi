const { exec } = require("child_process");

module.exports = async (command) => await new Promise((resolve, reject) => {
	exec(command, (error, stdout) => {
		if (error) reject(error);
		else resolve(stdout);
	});
});