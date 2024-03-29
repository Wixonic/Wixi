const package = require("./package");

module.exports = (any) => console.log(`[${package.displayName ?? package.name}]: ${typeof any == "string" ? any : JSON.stringify(any, null, 2)}`);