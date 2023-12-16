const { generateDependencyReport } = require("@discordjs/voice");
require("./console").info(generateDependencyReport());

const { Collection } = require("discord.js");
const fs = require("fs");

const { client, defaultActivity } = require("./client");
const commands = require("./commands");
const { info, log } = require("./console");
const { User } = require("./user");
const website = require("./website");

const config = require("./config");

client.commands = new Collection();

client.once("ready", async () => {
	const guild = await client.guilds.fetch(config.discord.guild);

	let after = null;

	for (let x = 0; x < Math.ceil(guild.memberCount / 1000); ++x) {
		const list = await guild.members.list({
			after: after
		});

		list.forEach(async (member) => {
			after = member.id;

			const user = await User.fromFile(member.id);
			if (user) await user.check();
		});
	}

	if (fs.existsSync("./files/rules.md")) {
		const rules = fs.readFileSync("./files/rules.md", { encoding: "utf-8" });

		const message = (await guild.rulesChannel.messages.fetch({
			limit: 1
		})).at(0);

		const content = {
			content: rules,
			components: [
				{
					type: 1,
					components: [
						{
							type: 2,
							label: `Verify your account`,
							url: `https://discord.wixonic.fr/authorize`,
							style: 5
						}
					]
				}
			]
		};

		if (message && message.content != rules) {
			await guild.rulesChannel.messages.delete(message.id);
			await guild.rulesChannel.send(content);

			log("Updated rules")
		} else if (!message) {
			await guild.rulesChannel.send(content);

			log("Added rules")
		}
	}

	commands.init();
	website.init();

	client.user.setActivity(defaultActivity);

	info(client.user.displayName + " connected");
});