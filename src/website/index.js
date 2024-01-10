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

	const display = async (mode, data, roles) => {
		const roleDisplay = (role, description = null) => `<div id="role-${role.id}" class="role"${roles.checked.includes(role.id) ? "" : " disabled"} value="${data.roles.includes(role.id) ? "true" : "false"}" title="${description ?? (roles.checked.includes(role.id) ? "" : "You can't get this role.")}">
	<div class="color" style="--color: ${role.color}"></div>
	<div class="name">${role.name}</div>
	<div class="check">
		<svg xmlns="http://www.w3.org/2000/svg" height="16" width="14" viewBox="0 0 448 512" class="icon">
			<path fill="currentColor" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
		</svg>
	</div>
</div>`;

		let html = "";

		switch (mode) {
			case "app":
				let rolesHTML = {
					booster: "",
					customization: "",
					notification: "",
					colors: "",
					special: "",
					other: ""
				};

				for (let x in roles.all) {
					const role = roles.all[x];

					switch (true) {
						case roles.booster.id == role.id:
							rolesHTML.booster += roleDisplay(role, roles.booster.description);
							break;

						case roles.customization.find((customizationRole) => customizationRole.id == role.id) != undefined:
							rolesHTML.customization += roleDisplay(role, roles.customization.find((customizationRole) => customizationRole.id == role.id).description);
							break;

						case roles.notification.find((notificationRole) => notificationRole.id == role.id) != undefined:
							rolesHTML.notification += roleDisplay(role, roles.notification.find((notificationRole) => notificationRole.id == role.id).description);
							break;

						case roles.colors.includes(role.id):
							rolesHTML.colors += roleDisplay(role);
							break;

						case roles.special.find((specialRole) => specialRole.id == role.id) != undefined:
							rolesHTML.special += roleDisplay(role, roles.special.find((specialRole) => specialRole.id == role.id).description);
							break;

						default:
							rolesHTML.other += roleDisplay(role);
							break;
					}
				}

				html += `<header>
	<button id="unauthorize" class="button">Disconnect</button>
</header>

<h1>Hi, ${data.displayName}</h1>
<p>This is still under development</p>

<h2>Roles</h2>

<section class="booster">${rolesHTML.booster}</section>

<section class="roles">
	<section class="category">
		<h3>Customization</h3>
		<section class="list">${rolesHTML.customization}</section>
	</section>
	<section class="category">
		<h3>Notification</h3>
		<section class="list">${rolesHTML.notification}</section>
	</section>
	<section class="category">
		<h3>Colors</h3>
		<section class="list">${rolesHTML.colors}</section>
	</section>
	<section class="category">
		<h3>Special</h3>
		<button id="refresh" class="button">Clear cache</button>
		<p>If you changed your <a href="https://support.discord.com/hc/en-us/articles/8063233404823-Connections-Linked-Roles-Community-Members#h_01GK285ENTCX37J9PYCM1ADXCH">connections</a> click the button above.</p>
		<section class="list">${rolesHTML.special}</section>
	</section>
	<section class="category">
		<h3>Other</h3>
		<section class="list">${rolesHTML.other}</section>
	</section>
</section>`;
				break;

			case "disconnected":
				html += `<h1>Uh</h1>
<p>You got disconnected, but don't worry, it'll reconnected as soon as possible.</p>
<p>Are you stuck? Ask help <a href="https://discord.wixonic.fr/help" class="link">here</a>!</p>`;
				break;

			case "loader":
				html += "Loading...";
				break;

			default:
				mode = "default";
				html += `<a href="https://discord.wixonic.fr/authorize" class="button">Authorize</a>
		<p>The authorization will have to be renewed in one hour for security reasons, because this application has access to sensitive data.</p>`;
				break;
		}

		document.body.innerHTML = `<main mode="${mode}">${html}</main>`;

		switch (mode) {
			case "app":
				document.getElementById("unauthorize").addEventListener("click", () => socket.emit("unauthorize"));

				document.getElementById("refresh").addEventListener("click", () => {
					display("loader");
					socket.emit("check");
				});

				for (let x in roles.all) {
					const role = roles.all[x];
					const tag = document.getElementById(`role-${role.id}`);

					tag.addEventListener("click", () => {
						if (roles.checked.includes(role.id)) {
							display("loader");
							socket.emit("role", role.id, tag.getAttribute("value") == "false");
						} else alert(tag.title ?? "Error");
					});
				}
				break;
		}
	};

	socket.on("disconnect", (reason) => {
		if (reason == "io server disconnect") display();
	});

	socket.on("data", (data, roles) => {
		window.data = data;
		window.roles = roles;
		display("app", data, roles);
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