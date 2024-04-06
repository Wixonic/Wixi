import { request } from "../../main.js";
import "https://cdn.plot.ly/plotly-2.30.0.min.js";

window.addEventListener("DOMContentLoaded", async () => {
	const rangeSelector = document.querySelector("select#range");
	const mainSelector = document.querySelector("select#main");
	const brawlersSelector = document.querySelector("select#brawlers");
	const compareCheckbox = document.querySelector("input[type=checkbox]#compare");
	const playersSelector = document.querySelector("select#players");

	const currentTrophies = document.querySelector("#currentTrophies");
	const highestTrophies = document.querySelector("#highestTrophies");

	const brawlersRequest = await request("/brawlers");
	const playersRequest = await request("/players");
	const playerRequest = await request(`/players/${id}`);

	const canvas = document.querySelector(".canvas");
	const battlelog = document.querySelector("#battlelog");

	if (brawlersRequest.code == 200 && playersRequest.code == 200 && playerRequest.code == 200) {
		const brawlers = brawlersRequest.items;
		const players = playersRequest.items;
		const player = playerRequest.data;

		for (const comparedPlayer of players) {
			if (comparedPlayer.id.slice(1) != id) {
				const option = document.createElement("option");
				option.value = comparedPlayer.id.slice(1);
				option.innerHTML = comparedPlayer.name;
				playersSelector.append(option);
			}
		}

		const views = async () => {
			canvas.innerHTML = "";

			brawlersSelector.classList.toggle("hidden", mainSelector.value != "brawlers");
			playersSelector.classList.toggle("hidden", !compareCheckbox.checked);

			const comparedPlayerRequest = compareCheckbox.checked ? await request(`/players/${playersSelector.value}`) : null;
			const comparedPlayer = comparedPlayerRequest?.code == 200 ? comparedPlayerRequest.data : null;

			const data = [];
			const shapes = [];

			const now = Date.now();

			switch (mainSelector.value) {
				case "trophies":
					currentTrophies.innerHTML = Object.values(player.trophies).at(-1);
					highestTrophies.innerHTML = Object.values(player["trophies.highest"]).at(-1);

					const x = [];
					for (const stringDate of Object.keys(player.trophies)) {
						const date = new Date();
						date.setTime(Number(stringDate) * 1000);
						x.push(date);
					}

					data.push({
						x,
						y: Object.values(player.trophies),

						line: {
							color: "#555",
							width: 1.5
						},
						marker: {
							color: "#CCC",
							size: 3
						},
						mode: "lines+markers",
						type: "scatter",

						hovertemplate: "%{y:d} trophies<extra></extra>",
						hoverlabel: {
							bgcolor: "#555",
							bordercolor: "transparent",
							font: {
								color: "#CCC"
							}
						},

						name: Object.values(player.name).at(-1)
					});

					shapes.push({
						type: "line",
						xref: "paper",
						x0: 0,
						x1: 1,
						y0: Object.values(player["trophies.highest"]).at(-1),
						y1: Object.values(player["trophies.highest"]).at(-1),
						line: {
							color: "#666",
							dash: "dot",
							width: 1
						},
						label: {
							font: {
								color: "#666"
							},
							text: "Highest",
							yanchor: "top",
						}
					});

					if (comparedPlayer) {
						currentTrophies.innerHTML += `<span style="color: #555;">/</span><span style="color: #0CC;">${Object.values(comparedPlayer.trophies).at(-1)}</span>`;
						highestTrophies.innerHTML += `<span style="color: #555;">/</span><span style="color: #0CC;">${Object.values(comparedPlayer["trophies.highest"]).at(-1)}</span>`;

						const comparedX = [];
						for (const stringDate of Object.keys(comparedPlayer.trophies)) {
							const date = new Date();
							date.setTime(Number(stringDate) * 1000);
							comparedX.push(date);
						}

						data.push({
							x: comparedX,
							y: Object.values(comparedPlayer.trophies),

							line: {
								color: "#055",
								width: 1.5
							},
							marker: {
								color: "#0CC",
								size: 3
							},
							mode: "lines+markers",
							type: "scatter",

							hovertemplate: "%{y:d} trophies<extra></extra>",
							hoverlabel: {
								bgcolor: "#055",
								bordercolor: "transparent",
								font: {
									color: "#0CC"
								}
							},

							name: Object.values(comparedPlayer.name).at(-1)
						});

						shapes.push({
							type: "line",
							xref: "paper",
							x0: 0,
							x1: 1,
							y0: Object.values(comparedPlayer["trophies.highest"]).at(-1),
							y1: Object.values(comparedPlayer["trophies.highest"]).at(-1),
							line: {
								color: "#066",
								dash: "dot",
								width: 1
							},
							label: {
								font: {
									color: "#066"
								},
								text: "Highest",
								yanchor: "top",
							}
						});
					}
					break;

				case "brawlers":


					currentTrophies.innerHTML = Object.values(player.trophies).at(-1);
					highestTrophies.innerHTML = Object.values(player["trophies.highest"]).at(-1);

					data.push({
						x: [],
						y: [],

						line: {
							color: "#555",
							width: 1.5
						},
						marker: {
							color: "#CCC",
							size: 3
						},
						mode: "lines+markers",
						type: "scatter",

						hovertemplate: "%{y:d} trophies<extra></extra>",
						hoverlabel: {
							bgcolor: "#555",
							bordercolor: "transparent",
							font: {
								color: "#CCC"
							}
						},

						name: Object.values(player.name).at(-1)
					});

					shapes.push({
						type: "line",
						xref: "paper",
						x0: 0,
						x1: 1,
						y0: Object.values(player["trophies.highest"]).at(-1),
						y1: Object.values(player["trophies.highest"]).at(-1),
						line: {
							color: "#888",
							dash: "dot",
							width: 1
						},
						label: {
							text: `Highest trophies with [[BRAWLER.NAME]]`,
							yanchor: "top",
						}
					});

					if (compareCheckbox.checked) {


						currentTrophies.innerHTML += `<span style="color: #555;">/</span><span style="color: #0CC;">${Object.values(comparedPlayer.trophies).at(-1)}</span>`;
						highestTrophies.innerHTML += `<span style="color: #555;">/</span><span style="color: #0CC;">${Object.values(comparedPlayer["trophies.highest"]).at(-1)}</span>`;

						data.push({
							x: [],
							y: [],

							line: {
								color: "#055",
								width: 1.5
							},
							marker: {
								color: "#0CC",
								size: 3
							},
							mode: "lines+markers",
							type: "scatter",

							hovertemplate: "%{y:d} trophies<extra></extra>",
							hoverlabel: {
								bgcolor: "#055",
								bordercolor: "transparent",
								font: {
									color: "#0CC"
								}
							},

							name: Object.values(comparedPlayer.name).at(-1)
						});

						shapes.push({
							type: "line",
							xref: "paper",
							x0: 0,
							x1: 1,
							y0: Object.values(comparedPlayer["trophies.highest"]).at(-1),
							y1: Object.values(comparedPlayer["trophies.highest"]).at(-1),
							line: {
								color: "#066",
								dash: "dot",
								width: 1
							},
							label: {
								font: {
									color: "#066"
								},
								text: "Highest",
								yanchor: "top",
							}
						});
					}
					break;
			}

			const periods = {
				"year": 12 * 28 * 24 * 60 * 60,
				"6months": 6 * 28 * 24 * 60 * 60,
				"3months": 3 * 28 * 24 * 60 * 60,
				"month": 28 * 24 * 60 * 60,
				"2weeks": 14 * 24 * 60 * 60,
				"week": 7 * 24 * 60 * 60,
				"3days": 3 * 24 * 60 * 60,
				"day": 24 * 60 * 60,
				"6hours": 6 * 60 * 60,
				"3hours": 3 * 60 * 60,
				"hour": 60 * 60
			};

			const start = new Date();
			start.setTime(Math.max(
				now - (periods[rangeSelector.value] ? periods[rangeSelector.value] * 1000 : now),
				Number(Object.keys(player.name).at(0)) * 1000,
				Number(comparedPlayer ? Object.keys(comparedPlayer.name).at(0) : 0) * 1000
			));

			const end = new Date();
			end.setTime(now);

			Plotly.newPlot(canvas, data, {
				xaxis: {
					showline: false,

					ticks: "outside",
					tickcolor: "#AAA",
					tickwidth: 1,
					ticklen: 4,
					tickfont: {
						size: 12,
						color: "#AAA"
					},

					showgrid: false,

					range: [
						start,
						end
					]
				},
				yaxis: {
					showline: true,
					linecolor: "#AAA",
					linewidth: 1,

					ticks: "outside",
					tickcolor: "#AAA",
					tickwidth: 1,
					ticklen: 4,
					tickfont: {
						size: 12,
						color: "#AAA"
					},

					showgrid: false,

					fixedrange: true
				},

				shapes,

				showlegend: compareCheckbox.checked,

				font: {
					family: "Arial"
				},

				hoverdistance: 50,

				plot_bgcolor: "transparent",
				paper_bgcolor: "transparent",

				margin: {
					t: 5,
					r: 30,
					b: 70,
					l: 70
				}
			}, {
				displayModeBar: false,
				responsive: true
			});
		};

		mainSelector.addEventListener("change", views);
		rangeSelector.addEventListener("change", views);
		brawlersSelector.addEventListener("change", views);
		compareCheckbox.addEventListener("change", views);
		playersSelector.addEventListener("change", views);

		views();

		player.battles.sort((battleA, battleB) => battleB.date - battleA.date);

		const victory = {
			count: 0,
			total: 0,

			get percentage() {
				try {
					return Number((this.count / this.total * 100).toFixed(2)) + "%";
				} catch {
					return "0%";
				}
			}
		};

		const showdownVictory = {
			count: 0,
			total: 0,

			get percentage() {
				try {
					return Number((this.count / this.total * 100).toFixed(2)) + "%";
				} catch {
					return "0%";
				}
			}
		};

		for (const battle of player.battles) {
			const battleEl = document.createElement("div");
			battleEl.classList.add("battle", battle.mode, battle.type);
			battlelog.append(battleEl);

			let battlePlayersEls = "";

			console.log(battle);

			for (const team of battle.teams ?? [battle.players ?? []]) {
				battlePlayersEls += `<div class="team">`;
				for (const player of team) battlePlayersEls += `<div class="player" rank="${player.rank ?? "none"}"><img src="/brawldata/assets/icon/brawler/${player.brawler}.png" alt="${brawlers[player.brawler].name}" /><div class="name">${player.name}</div><div class="power">${player.power}</div>${player.trophies ? `<div class="trophies"><span class="trophies icon"></span>${player.trophies}</div>` : ""}</div>`;
				battlePlayersEls += "</div>";
			}

			if (battle.duration) battleEl.innerHTML += `<div class="duration">${battle.duration}s</div>`;
			battleEl.innerHTML += `<div class="mode">${battle.mode}</div><div class="event">Event #${battle.event}</div><div class="players">${battlePlayersEls}</div>`;

			if (battle.mode.endsWith("Showdown")) {
				if (battle.rank == 1) showdownVictory.count++;
				showdownVictory.total++;
			} else {
				if (battle.result == "victory") victory.count++;
				victory.total++;
			}
		}
	} else canvas.innerHTML = "An error occured.";
});