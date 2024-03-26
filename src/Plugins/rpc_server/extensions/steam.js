const { Extension } = require("../extension");

const clientManager = require("../client");
const config = require("../config");



module.exports = new Extension("Steam", "/steam", null, null, config.extensions.steam.clientId, config.extensions.steam.clientSecret);