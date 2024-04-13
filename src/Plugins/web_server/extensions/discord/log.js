const log = require("../../log");

module.exports = (any) => log(`[Discord] ${typeof any == "string" ? any : JSON.stringify(any, null, 2)}`);