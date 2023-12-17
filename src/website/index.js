import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

const search = new URLSearchParams(location.search);

if (search.has("uid") && search.has("key")) {
	const uid = search.get("uid");
	const key = search.get("key");

	localStorage?.setItem("uid", uid) ?? sessionStorage?.setItem("uid", uid);
	localStorage?.setItem("uid", uid) ?? sessionStorage?.setItem("uid", uid);
	localStorage?.setItem("key", key) ?? sessionStorage?.setItem("key", key);
	localStorage?.setItem("key", key) ?? sessionStorage?.setItem("key", key);

	search.delete("uid");
	search.delete("key");

	if (search.size > 0) location.search = "?" + search.toString();
	else location.search = "";
} else {
	const socket = io({
		auth: {
			id: localStorage?.getItem("uid") ?? sessionStorage?.getItem("uid"),
			key: localStorage?.getItem("key") ?? sessionStorage?.getItem("key")
		}
	});

	const display = (mode) => {
		let html = "";

		switch (mode) {
			case "app":
				html += `<h1>Hi, ${data.displayName}</h1><p>Soon...</p>`;
				break;

			case "disconnected":
				html += `<h1>Uh</h1><p>You got disconnected, but don't worry, it'll reconnected as soon as possible.</p><p>Are you stuck? Ask help <a href="https://discord.wixonic.fr/help">here</a>!</p>`;
				break;

			case "loader":
				html += "Loading...";
				break;

			default:
				html += `<a href="https://discord.wixonic.fr/authorize">Authorize</a>`;
				break;
		}

		document.body.innerHTML = html;
	};

	socket.on("data", (data) => {
		window.data = data;
		display("app");
	});

	socket.io.on("reconnect", () => {
		display("loader");
		socket.emit("data");
	});

	socket.on("connect_error", (code) => {
		if (code.message == 401) display();
		else display("disconnected");
	});

	display("loader");
}