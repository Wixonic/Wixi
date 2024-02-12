const blessed = require("blessed");
const fs = require("fs");
const path = require("path");

const settings = require("./settings");

const screen = blessed.screen({
	dockBorders: true,
	smartCSR: true
});

const box = blessed.box({
	parent: screen,

	content: "",
	tags: true,

	align: "left",
	valign: "bottom",

	height: "100%-2",
	width: "100%",

	fg: "#FFFFFF",

	scrollable: true,

	scrollbar: {
		style: {
			fg: "#555555",
			bg: "#333333"
		}
	}
});

const input = blessed.textbox({
	parent: screen,

	inputOnFocus: true,

	top: "100%-2",

	height: 3,
	width: "100%",

	border: {
		fg: "#222222",
		type: "line"
	},

	fg: "#FFFFFF"
});

input.on("cancel", () => process.exit(0));
screen.key("escape", () => process.exit(0));

/**
 * Console manager
 */
const console = {
	/**
	 * Returns a Blessed textbox
	 */
	input,

	/**
	 * Returns a formatted timestamp
	 * @type {string}
	 */
	get timestamp() {
		return `${new Date().getDate().toString().padStart(2, "0")}/${(new Date().getMonth() + 1).toString().padStart(2, "0")}/${new Date().getFullYear()} ${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}:${new Date().getSeconds().toString().padStart(2, "0")}.${new Date().getMilliseconds().toString().padStart(3, "0")}`;
	},

	/**
	 * Writes raw text in logs
	 * @param {string} text
	 * @param {string?} rawText - Text without Blessed tags, uses `text` if `rawText` is null
	 */
	write: (text, rawText) => {
		if (box.content == "") box.content = text;
		else box.content += `\n${text}{/}`;

		if (!fs.existsSync(settings.log.path)) fs.mkdirSync(settings.log.path, { recursive: true });
		fs.appendFileSync(path.join(settings.log.path, "main.log"), `${console.timestamp}: ${rawText ?? text}\n`, { encoding: "utf-8" });

		box.scrollTo(box.getScrollHeight());

		screen.render();
	},

	/**
	 * Writes error in logs
	 * @param {...string} error
	 */
	error: (...error) => {
		for (const part of error) console.write(`{#ff0000-fg}${part}`, `[ERR] - ${part}`);
	},

	/**
	 * Writes info in logs
	 * @param {...string} info
	 */
	info: (...info) => {
		for (const part of info) console.write(`{#0077ff-fg}${part}`, `[INF] - ${part}`);
	},

	/**
	 * Writes text in logs
	 * @param {...string} text
	 */
	log: (...text) => {
		for (const part of text) console.write(`{#888888-fg}${part} `, `[LOG] - ${part}`);
	},

	/**
	 * Writes warn in logs
	 * @param {...string} warn
	 */
	warn: (...warn) => {
		for (const part of warn) console.write(`{#ffaa00-fg}${part} `, `[WRN] - ${part}`);
	}
};

if (!fs.existsSync(settings.log.path)) fs.mkdirSync(settings.log.path, { recursive: true });
fs.appendFileSync(path.join(settings.log.path, "main.log"), `${console.timestamp}: ----------STARTED ----------\n`, { encoding: "utf-8" });

const exitHandler = () => {
	if (!fs.existsSync(settings.log.path)) fs.mkdirSync(settings.log.path, { recursive: true });
	fs.appendFileSync(path.join(settings.log.path, "main.log"), `${console.timestamp}: ----------STOPPED ----------\n`, { encoding: "utf-8" });
};

process.on("exit", () => exitHandler());

input.focus();
screen.render();

module.exports = console;