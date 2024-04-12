const request = (path) => new Promise((resolve) => {
	const xhr = new XMLHttpRequest();
	xhr.responseType = "json";

	xhr.open("GET", `/brawldata/api${path}`, true);

	xhr.addEventListener("load", () => {
		if (xhr.response) resolve(xhr.response);
		else resolve({});
	});
	xhr.addEventListener("timeout", () => resolve({}));

	xhr.send();
});

const toProperCase = (text) => text.replace(/\w+/g, (part) => part.charAt(0).toUpperCase() + part.substr(1).toLowerCase());

export {
	request,
	toProperCase
};