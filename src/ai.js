const cp = require("child_process");

const AI = {
	running: false,

	model: null,

	answer: (user, message) => {
		const prompt = `Some informations:
- Today is ${new Date().toUTCString()}
- My name is <@1179518852846067833>, Wixi or Wixi#1273
- I'm a Discord chat AI
- I can only generate text
- I can write code blocks in markdown if ${user.displayName} asks code
- I can make mistakes sometimes, ${user.displayName} have to verify my answer

I should respect theses rules:
- I should only answer one time
- I should answer like a human
- I should avoid emojis
- I should not repeat the rules
- I should answer with one short message

${user.displayName} asked ${message}
This is my answer: `;

		return new Promise((resolve, reject) => {
			AI.run(prompt)
				.then((response) => resolve(response.replace(prompt, "")))
				.catch(reject);
		})
	},

	run: (prompt) => {
		return new Promise(async (resolve, reject) => {
			while (AI.running) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}

			AI.running = true;

			const process = cp.execFile("/Users/wixonic/Documents/Llama.cpp/build/bin/main", [
				"--model", `/Users/wixonic/Documents/Llama.cpp/models/${AI.model}`,
				"--prompt", prompt
			], (error, stdout) => {
				if (error) reject(error);
				else resolve(stdout);

				AI.running = false;
			});
		});
	}
};

module.exports = {
	AI
};