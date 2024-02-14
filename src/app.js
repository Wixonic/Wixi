const { app, Menu, nativeImage, Tray } = require("electron");
const path = require("path");

app.once("ready", () => {
	const tray = new Tray(path.join(__dirname, "assets/tray.png"));

	tray.setContextMenu(Menu.buildFromTemplate([
		{
			label: "Quit",
			type: "normal",
			click: () => app.quit()
		}
	]));

	tray.setToolTip(app.getName());

	app.dock.hide();
});