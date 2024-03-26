const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");



module.exports = new Extension("Roblox", "/roblox", null, null, config.extensions.roblox.clientId, config.extensions.roblox.clientSecret);