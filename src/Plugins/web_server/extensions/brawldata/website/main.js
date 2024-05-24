const request = (path) => new Promise((resolve) => {
	const xhr = new XMLHttpRequest();
	xhr.responseType = "json";

	xhr.open("GET", `/brawldata/api${path}`, true);

	xhr.addEventListener("load", () => {
		let headers = {};
		for (const headerData of xhr.getAllResponseHeaders().split("\n")) {
			const headerArray = headerData.split(":");

			if (headerArray.length >= 2) headers[headerArray[0].trim().toLowerCase()] = headerArray[1].trim();
		}

		console.log(headers);

		if (xhr.response) resolve({
			headers,
			response: xhr.response
		});
		else resolve({
			headers,
			response: {}
		});
	});
	xhr.addEventListener("timeout", () => resolve({}));

	xhr.send();
});

const toProperCase = (text) => text.replace(/\w+/g, (part) => part.charAt(0).toUpperCase() + part.substr(1).toLowerCase());

export {
	request,
	toProperCase
};