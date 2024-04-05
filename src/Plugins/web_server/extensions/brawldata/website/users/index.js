import { request } from "../main.js";

const display = (filter) => {
	const mainEl = document.body.querySelector("main");
	mainEl.innerHTML = "";

	for (const userData of window.users) {
		if (!filter || userData.name.toLowerCase().startsWith(filter) || userData.id.toLowerCase().startsWith(filter) || userData.id.slice(1).toLowerCase().startsWith(filter)) {
			const userEl = document.createElement("a");
			userEl.classList.add("user");
			userEl.href = userData.id.slice(1) + "/";
			userEl.innerHTML = `<img src="https://cdn-old.brawlify.com/profile/${userData.icon + 28000000}.png" class="icon" alt="Player icon" /><div class="name">${userData.name}</div><div class="id">${userData.id}</div><div class="trophies">${userData.trophies}</div>`;
			mainEl.append(userEl);
		}
	}
};

window.addEventListener("DOMContentLoaded", async () => {
	const usersData = await request("/users");
	window.users = usersData.code == 200 ? usersData.items : [];

	display();

	const search = document.querySelector("input[type=search]");
	search.addEventListener("input", () => display(search.value.toLowerCase()));
});