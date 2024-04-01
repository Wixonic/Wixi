import { request } from "../main.js";

const display = (filter) => {
	const main = document.body.querySelector("main");
	main.innerHTML = "";

	for (const id in window.users) {
		if (!filter || window.users[id].startsWith(filter)) {
			const user = document.createElement("a");
			user.classList.add("button");
			user.href = `${id}/`;
			user.innerHTML = window.users[id];
			main.append(user);
		}
	}
};

window.addEventListener("DOMContentLoaded", async () => {
	window.users = await request("/users");

	display();

	const search = document.querySelector("input[type=search]");
	search.addEventListener("input", () => display(search.value));
});