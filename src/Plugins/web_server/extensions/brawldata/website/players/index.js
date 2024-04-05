import { request } from "../main.js";

const display = (filter) => {
	const mainEl = document.body.querySelector("main");
	mainEl.innerHTML = "";

	for (const playerData of window.players) {
		if (!filter || playerData.name.toLowerCase().startsWith(filter) || playerData.id.toLowerCase().startsWith(filter) || playerData.id.slice(1).toLowerCase().startsWith(filter)) {
			const playerEl = document.createElement("a");
			playerEl.classList.add("player");
			playerEl.href = playerData.id.slice(1) + "/";
			playerEl.innerHTML = `<img src="/brawldata/assets/icon/player/${playerData.icon}.png" class="icon" alt="Player icon" /><div class="name">${playerData.name}</div><div class="id">${playerData.id}</div>`;
			mainEl.append(playerEl);
		}
	}
};

window.addEventListener("DOMContentLoaded", async () => {
	const playersData = await request("/players");
	window.players = playersData.code == 200 ? playersData.items : [];

	display();

	const search = document.querySelector("input[type=search]");
	search.addEventListener("input", () => display(search.value.toLowerCase()));
});