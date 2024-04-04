module.exports = {
	toProperCase: (text) => text.replace(/\w\S*/g, (part) => part.charAt(0).toUpperCase() + part.substr(1).toLowerCase()),
	toTime: (startTimestamp, endTimestamp) => {
		const duration = endTimestamp - startTimestamp;

		const minutes = Math.floor(duration / (1000 * 60));
		const seconds = Math.floor((duration % (1000 * 60)) / 1000);
		const milliseconds = duration % 1000;

		return `${minutes > 0 ? String(minutes).padStart(2, "0") + ":" : ""}${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
	},
	wait: (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))
};