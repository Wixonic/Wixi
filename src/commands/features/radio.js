const { SlashCommandBuilder, SlashCommandSubcommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder, Colors, ActivityType, StageInstancePrivacyLevel } = require("discord.js");
const { createAudioPlayer, createAudioResource, AudioPlayerStatus, joinVoiceChannel, VoiceConnectionStatus } = require("@discordjs/voice");
const fs = require("fs");
const path = require("path");
const ytdl = require("ytdl-core");

const { client, defaultActivity } = require("../../client");
const { error, log } = require("../../console");

class Song {
	constructor(url) {
		this.url = url;
	};

	async load() {
		const rawInfo = await ytdl.getInfo(this.url);

		this.info = {
			id: rawInfo?.videoDetails?.videoId,
			url: rawInfo?.videoDetails?.video_url,
			title: rawInfo?.videoDetails?.title,
			author: {
				name: rawInfo?.videoDetails?.author?.name,
				url: rawInfo?.videoDetails?.author?.channel_url,
				avatar: rawInfo?.videoDetails?.author?.thumbnails[0]?.url
			},
			duration: rawInfo?.videoDetails?.lengthSeconds,
			format: rawInfo?.formats?.filter((format) => format.hasAudio && !format.hasVideo).sort((formatA, formatB) => formatA.bitrate - formatB.bitrate)[0]
		};

		const directory = path.join(process.cwd(), "cache");

		if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

		this.path = path.join(directory, `${this.info.id}.${this.info.format.container}`);

		const stream = ytdl.downloadFromInfo(rawInfo, {
			filter: "audioonly"
		});

		await new Promise((resolve) => {
			stream.pipe(fs.createWriteStream(this.path));
			stream.once("end", () => {
				this.resource = createAudioResource(fs.createReadStream(this.path), {
					inlineVolume: true
				});

				this.resource.volume.setVolume(0.25);

				resolve();
			});
		});
	};

	embed() {
		return new EmbedBuilder()
			.setAuthor({
				name: this.info?.author?.name ?? "Unknown",
				url: this.info?.author?.url,
				iconURL: this.info?.author?.avatar
			})
			.setColor(Colors.Red)
			.setDescription(this.info?.title ?? "Unknown song")
			.setURL(this.info?.url)
			.setFooter({ text: `Duration: ${(this.info?.duration / 60).toFixed().padStart(2, "0")}:${String(this.info?.duration % 60).padStart(2, "0")}` });
	};
};

const Radio = {
	player: createAudioPlayer(),

	current: null,

	queue: {
		list: [],
		locked: false
	},

	add(song) {
		this.queue.list.push(song);
		if (this.current == null) this.next();
	},

	async connect(channel, voiceAdapterCreator) {
		if (channel && voiceAdapterCreator) {
			this.connection = joinVoiceChannel({
				channelId: channel.id,
				guildId: channel.guild.id,
				selfDeaf: false,
				selfMute: false,
				adapterCreator: voiceAdapterCreator
			});

			this.connection.on("stateChange", (oldState, newState) => log(`Radio: Connection transitioned from ${oldState.status} to ${newState.status}`));
			this.subscription = this.connection.subscribe(this.player);
		}
	},

	next() {
		if (this.queue.list.length > 0 && this.connection?.state?.status == VoiceConnectionStatus.Ready) {
			this.current = this.queue.list.shift();
			this.player.play(this.current.resource);

			client.user.setActivity({
				name: "Listening to the radio",
				state: `Playing ${this.current.info?.title ?? "Unknown song"} by ${this.current.info?.author?.name ?? "Unknown artist"}`,
				type: ActivityType.Custom
			});

			log(`Radio: Playing ${this.current.info?.title ?? "Unknown song"} by ${this.current.info?.author?.name ?? "Unknown artist"}`);
		} else if (this.current != null) {
			this.current = null;
			client.user.setActivity(defaultActivity);
		}
	},

	stop() {

	}
};

Radio.player.on("stateChange", (oldState, newState) => log(`Radio: Audio player transitioned from ${oldState.status} to ${newState.status}`));

setInterval(() => {
	if (Radio.player.state.status == AudioPlayerStatus.Idle) Radio.next();
}, 500);

module.exports = {
	data: new SlashCommandBuilder()
		.setName("radio")
		.setDescription("Stuff about the radio")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("move")
				.setDescription("Move the radio")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Target channel")
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("play")
				.setDescription("Play a song")
				.addStringOption((option) =>
					option
						.setName("url")
						.setDescription("The YouTube song url")
						.setRequired(true)
				)
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName("stop")
				.setDescription("Stop the radio")
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("current")
				.setDescription("Display the current song")
		)
		.addSubcommandGroup((subcommandGroup) =>
			subcommandGroup
				.setName("queue")
				.setDescription("Radio queue related commands")
				.addSubcommand((subcommand) =>
					subcommand
						.setName("add")
						.setDescription("Add a song to the queue")
						.addStringOption((option) =>
							option
								.setName("url")
								.setDescription("The YouTube song url")
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("clear")
						.setDescription("Clear the queue")
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("list")
						.setDescription("Display all upcoming songs")
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("lock")
						.setDescription("Lock the queue")
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("unlock")
						.setDescription("Unlock the queue")
				)
		),

	async execute(interaction) {
		switch (interaction.options.getSubcommandGroup()) {
			case "queue":
				switch (interaction.options.getSubcommand()) {
					case "add":
						await interaction.deferReply();

						if (!Radio.queue.locked) {
							const song = new Song(interaction.options.getString("url", true));

							try {
								await song.load();
								await interaction.followUp({
									content: "Added a new song to the queue",
									embeds: [song.embed()]
								});
								Radio.add(song);

								log(interaction.userLog + "New song added to queue: " + song.info?.id);
							} catch (e) {
								error(`${interaction.userLog}Failed to load song: ${e}`);
								await interaction.followUp({ content: "Failed to load song", ephemeral: true });
							}
						} else await interaction.followUp({ content: "Insufficient permissions: The queue is currently locked.", ephemeral: true });
						break;

					case "clear":
						await interaction.reply({ content: "Not implemented.", ephemeral: true });
						break;

					case "list":
						await interaction.reply({ content: "Not implemented.", ephemeral: true });
						break;

					case "lock":
						if (interaction.memberPermissions.has(PermissionFlagsBits.ManageEvents | PermissionFlagsBits.MuteMembers)) {
							if (!Radio.queue.locked) {
								Radio.queue.locked = true;
								await interaction.reply({ content: "Radio queue is now locked." });
								log(interaction.userLog + "Radio: queue locked");
							} else await interaction.reply({ content: "Radio queue is alreay locked.", ephemeral: true });
						} else await interaction.reply({ content: "Insufficient permissions.", ephemeral: true });
						break;

					case "unlock":
						if (interaction.memberPermissions.has(PermissionFlagsBits.ManageEvents | PermissionFlagsBits.MuteMembers)) {
							if (Radio.queue.locked) {
								Radio.queue.locked = false;
								await interaction.reply({ content: "Radio queue is now unlocked." });
								log(interaction.userLog + "Radio: queue unlocked");
							} else await interaction.reply({ content: "Radio queue is already unlocked.", ephemeral: true });
						} else await interaction.reply({ content: "Insufficient permissions.", ephemeral: true });
						break;

					default:
						throw "Invalid subcommand";
						break;
				}
				break;

			default:
				switch (interaction.options.getSubcommand()) {
					case "current":
						if (Radio.current) {
							await interaction.reply({
								content: "Currently playing:",
								embeds: [Radio.current.embed()],
								ephemeral: true
							});
						} else await interaction.reply({ content: "There's no current song.", ephemeral: true });
						break;

					case "move":
						if (interaction.memberPermissions.has(PermissionFlagsBits.ManageEvents | PermissionFlagsBits.MuteMembers | PermissionFlagsBits.MoveMembers)) {
							await Radio.connect(interaction.options.getChannel("channel", true, [ChannelType.GuildVoice, ChannelType.GuildStageVoice]), interaction.guild.voiceAdapterCreator);
							await interaction.reply({ content: "Radio moved", ephemeral: true });
						} else await interaction.reply({ content: "Insufficient permissions.", ephemeral: true });
						break;

					case "play":
						await interaction.reply({ content: "Not implemented.", ephemeral: true });
						break;

					case "stop":
						await interaction.reply({ content: "Not implemented.", ephemeral: true });
						break;

					default:
						throw "Invalid subcommand or subcommand group";
						break;
				}
				break;
		}
	}
};