const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const config = require("../../config");
const settings = require("../../settings");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("beta-storage")
		.setDescription("[BETA] Share big files on Discord")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("upload")
				.setDescription("[BETA] Upload a big file"))
		.addSubcommand((subcommand) =>
			subcommand
				.setName("download")
				.setDescription("[BETA] Download a big file")
				.addStringOption((option) =>
					option
						.setName("token")
						.setDescription("The token of the file")
						.setRequired(true)
				)
		),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case "download":
				const downloadToken = interaction.options.getString("token", true);

				await interaction.safeReply({
					components: [
						{
							type: 1,
							components: [
								{
									style: 5,
									label: "Download",
									url: `https://discord.wixonic.fr/storage/download?token=${downloadToken}`,
									type: 2
								}
							]
						}
					],
					embeds: [
						{
							color: 0x0077FF,
							description: "Click on the button below to download.",
							footer: {
								text: `Token: ${downloadToken}`
							},
							title: "Download request",
						}
					],
					ephemeral: true,
					allowedMentions: {
						repliedUser: false
					}
				});
				break;

			case "upload":
				const uploadToken = "test";

				const rootStats = fs.statfsSync("/");
				const available = rootStats.bfree * rootStats.bsize - settings.storage.needed * (10 ** 9);

				await interaction.safeReply({
					components: [
						{
							type: 1,
							components: [
								{
									style: 5,
									label: "Upload",
									url: `https://discord.wixonic.fr/storage/upload?token=${uploadToken}`,
									type: 2
								}
							]
						}
					],
					embeds: [
						{
							color: 0xFF00FF,
							description: "Click on the button below to upload a file.",
							footer: {
								text: `Storage available: ${Format.size(available)} • Token: ${uploadToken}`
							},
							title: "Upload request"
						}
					],
					ephemeral: true,
					allowedMentions: {
						repliedUser: false
					}
				});
				break;

			default:
				const e = `No subcommand matching "/${interaction.commandName} ${subcommand}" was found.`;
				interaction.log(e);

				await interaction.safeReply({
					content: e,
					ephemeral: true,
					allowedMentions: {
						repliedUser: false
					}
				});
				break;
		}
	},

	plugin: (router) => {
		router.get("/storage/download", (req, res) => {
			const url = new URL(req.url, config.website.host);

			const token = url.searchParams.get("token");

			if (token) {
				const folderPath = path.join(settings.storage.path, token);
				const dataPath = path.join(folderPath, "data.json");

				if (fs.existsSync(dataPath)) res.setHeader("location", `/download/${url.search}`).sendStatus(307);
				else res.setHeader("location", "/download/").sendStatus(307);
			} else res.setHeader("location", "/download/").sendStatus(307);
		});

		router.get("/storage/upload", (req, res) => {
			const url = new URL(req.url, config.website.host);

			const token = url.searchParams.get("token");

			if (token) {
				const folderPath = path.join(settings.storage.path, token);
				const dataPath = path.join(folderPath, "data.json");

				if (!fs.existsSync(dataPath)) res.setHeader("location", `/upload/${url.search}`).sendStatus(307);
				else res.setHeader("location", "/upload/").sendStatus(307);
			} else res.setHeader("location", "/upload/").sendStatus(307);
		});
	}
};