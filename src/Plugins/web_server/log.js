const package = require("./package");

module.exports = (txt) => console.log(`[${package.displayName ?? package.name}]: ${txt}`);