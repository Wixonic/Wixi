module.exports = {
	wait: (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))
};