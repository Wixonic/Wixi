const CLEAR = "\x1b[0m";
const ERROR = "\x1b[91m";
const INFO = "\x1b[94m";
const LOG = "\x1b[90m";
const WARN = "\x1b[33m";

const write = (text) => console.log(LOG + `${new Date().getDate().toString().padStart(2, "0")}/${(new Date().getMonth() + 1).toString().padStart(2, "0")}/${new Date().getFullYear()} ${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}:${new Date().getSeconds().toString().padStart(2, "0")}.${new Date().getMilliseconds().toString().padStart(3, "0")}: ` + CLEAR + text);
const error = (text) => write(ERROR + text + CLEAR);
const info = (text) => write(INFO + text + CLEAR);
const log = (text) => write(LOG + text + CLEAR);
const warn = (text) => write(WARN + text + CLEAR);

module.exports = { error, info, log, warn };