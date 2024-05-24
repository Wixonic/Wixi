const log = require("../../log");

module.exports = (any) => log(`[BrawlData] ${typeof any == "string" ? any : JSON.stringify(any, null, 2)}`);