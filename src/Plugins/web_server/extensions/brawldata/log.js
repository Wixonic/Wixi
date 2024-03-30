const log = require("../../log");

module.exports = (any) => log(`[Brawl Data]: ${typeof any == "string" ? any : JSON.stringify(any, null, 2)}`);