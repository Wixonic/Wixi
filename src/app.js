const { Collection, MessageFlags } = require("discord.js");
const fs = require("fs");

const { client, defaultActivity } = require("./client");
const commands = require("./commands");
const { info } = require("./console");
const plugins = require("./plugins");
const { User } = require("./user");
const website = require("./website");

const settings = require("./settings");

client.commands = new Collection();

client.once("ready", async () => {
	const guild = await client.guilds.fetch(settings.guild);

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
		const rules = fs.readFileSync("./files/rules.md", "utf-8");

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
							url: settings.rules.url,
							style: 5
						}
					]
				}
			],
			flags: settings.rules.silent ? MessageFlags.SuppressNotifications : null
		};

		if (message && (message.content != rules || settings.rules.force)) {
			await guild.rulesChannel.messages.delete(message.id);
			await guild.rulesChannel.send(content);

			info("Updated rules")
		} else if (!message || settings.rules.force) {
			await guild.rulesChannel.send(content);

			info("Added rules")
		}
	}

	website.init();
	plugins.init();
	commands.init();

	client.user.setActivity(defaultActivity);

	info(`Bot ${client.user.displayName} is now online`);
});