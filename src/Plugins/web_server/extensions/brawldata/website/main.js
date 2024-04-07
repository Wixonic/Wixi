const formatRank = (rank) => ["1st", "2nd", "3rd"][rank - 1] ?? `${rank}th`;

const request = (path) => new Promise((resolve) => {
	const xhr = new XMLHttpRequest();
	xhr.responseType = "json";

	xhr.open("GET", `/brawldata/api/v2${path}`, true);

	xhr.addEventListener("error", () => resolve({}));
	xhr.addEventListener("load", () => {
		if (xhr.response) resolve(xhr.response);
		else resolve({});
	});
	xhr.addEventListener("timeout", () => resolve({}));

	xhr.send();
});

const toProperCase = (text) => text.replace(/\w+/g, (part) => part.charAt(0).toUpperCase() + part.substr(1).toLowerCase());

export {
	formatRank,
	request,
	toProperCase
};