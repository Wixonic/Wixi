import { request } from "../../main.js";
import "https://cdn.plot.ly/plotly-2.30.0.min.js";

window.addEventListener("DOMContentLoaded", async () => {
	const brawlers = await request("/brawlers");
	const users = await request("/users");

	const user = await request(`/users/${id}`);
	const stats = await request(`/users/${id}/stats`);

	const main = document.querySelector("main");

	const rangeSelector = document.querySelector("select#range");
	const mainSelector = document.querySelector("select#main");
	const brawlersSelector = document.querySelector("select#brawlers");
	const compareCheckbox = document.querySelector("input[type=checkbox]#compare");
	const usersSelector = document.querySelector("select#users");

	for (const id in brawlers) {
		const option = document.createElement("option");
		option.value = id;
		option.innerHTML = brawlers[id];
		brawlersSelector.append(option);
	}

	for (const userId in users) {
		if (userId != id) {
			const option = document.createElement("option");
			option.value = userId;
			option.innerHTML = users[userId];
			usersSelector.append(option);
		}
	}

	const views = async () => {
		main.innerHTML = "";

		brawlersSelector.classList.toggle("hidden", mainSelector.value != "brawlers");
		usersSelector.classList.toggle("hidden", !compareCheckbox.checked);

		const comparedUser = compareCheckbox.checked ? await request(`/users/${usersSelector.value}`) : null;
		const comparedStats = compareCheckbox.checked ? await request(`/users/${usersSelector.value}/stats`) : null;

		const data = [];
		const now = Date.now();

		switch (mainSelector.value) {
			case "trophies":
				data.push({
					x: Object.keys(stats.trophies),
					y: Object.values(stats.trophies),
					line: {
						color: "#AAA",
						width: 1
					},
					mode: "lines",
					type: "scatter",
					name: user.name
				});

				if (compareCheckbox.checked) {
					data.push({
						x: Object.keys(comparedStats.trophies),
						y: Object.values(comparedStats.trophies),
						line: {
							color: "#0FF",
							width: 1
						},
						mode: "lines",
						type: "scatter",
						name: comparedUser.name
					});
				}
				break;

			case "brawlers":
				const brawler = stats.brawlers.find((value) => value.id == brawlersSelector.value)?.trophies ?? {};

				data.push({
					x: Object.keys(brawler),
					y: Object.values(brawler),
					line: {
						color: "#AAA",
						width: 1
					},
					mode: "lines",
					type: "scatter",
					name: user.name
				});

				if (compareCheckbox.checked) {
					const comparedBrawler = comparedStats.brawlers.find((value) => value.id == brawlersSelector.value)?.trophies ?? {};

					data.push({
						x: Object.keys(brawler),
						y: Object.values(brawler),
						line: {
							color: "#AAA",
							width: 1
						},
						mode: "lines",
						type: "scatter",
						name: comparedUser.name
					});
				}
				break;
		}

		Plotly.newPlot(main, data, {
			showlegend: false,
			xaxis: {
				title: "Date",
				showline: true,
				showgrid: false,
				showticklabels: true,
				linecolor: "#AAA",
				linewidth: 2,
				ticks: "outside",
				tickcolor: "#AAA",
				tickwidth: 2,
				ticklen: 5,
				tickfont: {
					family: "Arial",
					size: 12,
					color: "#AAA"
				},
				range: [new Date().setTime(now - ({
					"year": 12 * 28 * 24 * 60 * 60 * 1000,
					"6months": 6 * 28 * 24 * 60 * 60 * 1000,
					"3months": 3 * 28 * 24 * 60 * 60 * 1000,
					"month": 28 * 24 * 60 * 60 * 1000,
					"2weeks": 14 * 24 * 60 * 60 * 1000,
					"week": 7 * 24 * 60 * 60 * 1000,
					"3days": 3 * 24 * 60 * 60 * 1000,
					"day": 24 * 60 * 60 * 1000,
					"6hours": 6 * 60 * 60 * 1000,
					"3hours": 3 * 60 * 60 * 1000,
					"hour": 60 * 60 * 1000
				}[rangeSelector.value] ?? now)), new Date().setTime(now)]
			},
			yaxis: {
				title: "Trophies",
				showline: true,
				showgrid: false,
				showticklabels: true,
				linecolor: "#AAA",
				linewidth: 2,
				ticks: "outside",
				tickcolor: "#AAA",
				tickwidth: 2,
				ticklen: 5,
				tickfont: {
					family: "Arial",
					size: 12,
					color: "#AAA"
				},
				fixedrange: true
			},

			hovermode: "x",
			showlegend: compareCheckbox.checked,

			plot_bgcolor: "transparent",
			paper_bgcolor: "transparent"
		}, {
			displayModeBar: false,
			responsive: true
		});
	};

	mainSelector.addEventListener("change", views);
	rangeSelector.addEventListener("change", views);
	brawlersSelector.addEventListener("change", views);
	compareCheckbox.addEventListener("change", views);
	usersSelector.addEventListener("change", views);

	views();
});