const formatRank = (rank) => ["1st", "2nd", "3rd"][rank - 1] ?? `${rank}th`;

const request = (path) => new Promise((resolve, reject) => {
	const xhr = new XMLHttpRequest();
	xhr.responseType = "json";
	xhr.open("GET", `/brawldata/api/v2${path}`, true);
	xhr.addEventListener("load", () => resolve(xhr.response));
	xhr.send();
});

const toProperCase = (text) => text.replace(/\w+/g, (part) => part.charAt(0).toUpperCase() + part.substr(1).toLowerCase());

export {
	formatRank,
	request,
	toProperCase
};