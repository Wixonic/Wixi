const request = (path) => new Promise((resolve, reject) => {
	const xhr = new XMLHttpRequest();
	xhr.responseType = "json";
	xhr.open("GET", `/brawldata/api${path}`, true);
	xhr.addEventListener("load", () => resolve(xhr.response));
	xhr.send();
});

export {
	request
};