const fs = require("fs");
const path = require("path");

const package = require("./package");

const versions = package.version.split(".");
const buildVersion = Number(versions.pop()) + 1;
package.version = `${versions.join(".")}.${buildVersion}`;
console.info(`v${package.version}`);

fs.writeFileSync(path.join(__dirname, "package.json"), JSON.stringify(package, 0, "\t"), { encoding: "utf-8" });