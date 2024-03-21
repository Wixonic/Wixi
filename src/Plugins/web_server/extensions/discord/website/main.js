import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

const search = new URLSearchParams(location.search);

const display = (mode, socket) => {
	if (display[mode]) document.body.innerHTML = `<main mode="${mode}">${display[mode](socket)}</main>`;
	else console.error(`Page not found: ${mode}`);
};

display.app = (socket) => "";
display.init = (socket) => `<a href="https://server.wixonic.fr/discord/authorize?redirect_url=${encodeURIComponent(location.href)}" class="button">Authorize</a>
<p>The authorization will have to be renewed in one hour for security reasons, because this application has access to sensitive data.</p>`;
display.loader = (socket) => "Loading...";
display.disconnected = (socket) => `<h1>Uh</h1>
<p>You got disconnected, but don't worry, it'll reconnected as soon as possible.</p>
<p>Are you stuck? Ask help <a href="https://server.wixonic.fr/discord/help" class="link">here</a>!</p>`;

const execute = (mode, socket) => {
	if (execute[mode]) execute[mode](socket);
	else console.error(`Page not found: ${mode}`);
};

execute.app = (socket) => null;
execute.init = (socket) => null;
execute.loader = (socket) => null;
execute.disconnected = (socket) => null;

if (search.has("uid") && search.has("key")) {
	const uid = search.get("uid");
	const key = search.get("key");

	localStorage?.setItem("uid", uid) ?? sessionStorage?.setItem("uid", uid);
	localStorage?.setItem("uid", uid) ?? sessionStorage?.setItem("uid", uid);
	localStorage?.setItem("key", key) ?? sessionStorage?.setItem("key", key);
	localStorage?.setItem("key", key) ?? sessionStorage?.setItem("key", key);

	search.delete("uid");
	search.delete("key");

	location.search = search.toString();
} else {
	const socket = io(`${location.hostname}:3000`, {
		auth: {
			id: localStorage?.getItem("uid") ?? sessionStorage?.getItem("uid"),
			key: localStorage?.getItem("key") ?? sessionStorage?.getItem("key"),
			page: location.href.replace(location.protocol + "//" + location.host, "")
		}
	});

	socket.on("data", (data, roles) => {
		window.data = data;
		window.roles = roles;

		display("app", socket);
		execute("app", socket);
	});

	socket.on("disconnect", (reason) => {
		if (reason == "io server disconnect") {
			display("init", socket);
			execute("init", socket);
		}
	});

	socket.io.on("reconnect", () => {
		display("loader", socket);
		execute("loader", socket);
	});

	socket.on("connect_error", (code) => {
		if (code.message == 401) {
			display("init", socket);
			execute("init", socket);
		} else {
			display("disconnected", socket);
			execute("disconnected", socket);
		}
	});

	display("loader", socket);
	execute("loader", socket);
}

export {
	display,
	execute
};