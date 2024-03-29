const clientManager = require("../client");
const { Extension } = require("../extension");

const config = require("../config");

// Steam RPC

module.exports = new Extension("Steam", "/steam", null, null);