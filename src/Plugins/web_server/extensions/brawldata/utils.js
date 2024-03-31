module.exports = {
	toProperCase: (text) => text.replace(/\w\S*/g, (part) => part.charAt(0).toUpperCase() + part.substr(1).toLowerCase()),
	wait: (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))
};