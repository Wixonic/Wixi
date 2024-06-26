import { request, toProperCase } from "../../main.js";
import "https://cdn.plot.ly/plotly-2.30.0.min.js";

window.addEventListener("DOMContentLoaded", async () => {
	const rangeSelector = document.querySelector("select#range");
	const mainSelector = document.querySelector("select#main");
	const brawlersSelector = document.querySelector("select#brawlers");
	const compareCheckbox = document.querySelector("input[type=checkbox]#compare");
	const playersSelector = document.querySelector("select#players");

	const playerIcon = document.querySelector("#playerIcon");
	const currentTrophies = document.querySelector("#currentTrophies");
	const highestTrophies = document.querySelector("#highestTrophies");

	const canvas = document.querySelector(".canvas");
	const battlelog = document.querySelector("#battlelog");

	const brawlersRequest = await request("/brawlers");
	const playersRequest = await request("/players");
	const playerRequest = await request(`/players/${id}`);

	if (brawlersRequest.response.code == 200 && playersRequest.response.code == 200 && playerRequest.response.code == 200) {
		const brawlers = brawlersRequest.response.items;
		const players = playersRequest.response.items;
		const player = playerRequest.response.data;

		playerIcon.src = `/brawldata/assets/icon/player/${Object.values(player.icon).at(-1)}.png`;

		for (const brawlerId in player.brawlers) {
			const option = document.createElement("option");
			option.value = brawlerId;
			option.innerHTML = brawlers[brawlerId].name;
			brawlersSelector.append(option);
		}

		for (const comparedPlayer of players) {
			if (comparedPlayer.id.slice(1) != id) {
				const option = document.createElement("option");
				option.value = comparedPlayer.id.slice(1);
				option.innerHTML = comparedPlayer.name;
				playersSelector.append(option);
			}
		}

		const views = async () => {
			brawlersSelector.classList.toggle("hidden", mainSelector.value != "brawlers");
			playersSelector.classList.toggle("hidden", !compareCheckbox.checked);

			const comparedPlayerRequest = compareCheckbox.checked ? await request(`/players/${playersSelector.value}`) : null;
			const comparedPlayer = comparedPlayerRequest?.code == 200 ? comparedPlayerRequest.data : null;

			canvas.innerHTML = "";

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
					const brawler = player.brawlers[brawlersSelector.value];

					currentTrophies.innerHTML = Object.values(brawler.trophies).at(-1);
					highestTrophies.innerHTML = Object.values(brawler["trophies.highest"]).at(-1);

					data.push({
						x: Object.keys(brawler.trophies),
						y: Object.values(brawler.trophies),

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
						y0: Object.values(brawler["trophies.highest"]).at(-1),
						y1: Object.values(brawler["trophies.highest"]).at(-1),
						line: {
							color: "#888",
							dash: "dot",
							width: 1
						},
						label: {
							text: `Highest with ${brawlers[brawlersSelector.value].name}`,
							yanchor: "top",
						}
					});

					if (compareCheckbox.checked) {
						const comparedBrawler = comparedPlayer.brawlers[brawlersSelector.value];

						if (comparedBrawler) {
							currentTrophies.innerHTML += `<span style="color: #555;">/</span><span style="color: #0CC;">${Object.values(comparedBrawler.trophies).at(-1)}</span>`;
							highestTrophies.innerHTML += `<span style="color: #555;">/</span><span style="color: #0CC;">${Object.values(comparedBrawler["trophies.highest"]).at(-1)}</span>`;

							data.push({
								x: Object.keys(comparedBrawler.trophies),
								y: Object.values(comparedBrawler.trophies),

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
								y0: Object.values(comparedBrawler["trophies.highest"]).at(-1),
								y1: Object.values(comparedBrawler["trophies.highest"]).at(-1),
								line: {
									color: "#066",
									dash: "dot",
									width: 1
								},
								label: {
									font: {
										color: "#066"
									},
									text: `Highest with ${brawlers[brawlersSelector.value].name}`,
									yanchor: "top",
								}
							});
						}
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
				"6hours": 6 * 60 * 60
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

		await views();

		class Statistic {
			constructor() {
				this.count = 0;
				this.total = 0;
			};

			get percentage() {
				try {
					return (this.count / this.total * 100).toFixed(1).padStart(2, "0") + "%";
				} catch {
					return "0%";
				}
			};
		};

		const victories = new Statistic();
		const showdownVictories = new Statistic();
		const starPlayer = new Statistic();

		const displayBattles = (battles) => {
			for (const battle of battles) {
				const battleEl = document.createElement("div");
				battleEl.classList.add("battle", battle.mode, battle.type);
				if (typeof battle.map?.environment == "string") battleEl.style.backgroundImage = `url("/brawldata/assets/maps/${battle.map.environment}.jpg")`;

				const playersEl = document.createElement("div");
				playersEl.classList.add("players");

				const displayPlayer = (player, teamEl) => {
					const playerEl = document.createElement("div");
					playerEl.classList.add("player");

					if (battle.starPlayer == player.tag) playerEl.classList.add("star");
					if ("#" + id == player.tag) playerEl.classList.add("self");

					const display = (type) => {
						let HTML = "";

						switch (type) {
							case "rank":
								HTML += `<img class="rank" src="/brawldata/assets/icon/rank/${player.trophies}.png" />`;
								break;

							case "trophies":
								if (typeof player.trophies == "number") HTML += `<div class="trophies"><span class="trophies icon"></span>${player.trophies}</div>`;
								break;

							case "power":
								if (typeof player.power == "number") HTML += `<div class="power">${player.power}</div>`;
								break;

							case "brawler":
								if (typeof player.brawler == "number") HTML += `<img class="brawler" src="/brawldata/assets/icon/brawler/${player.brawler}.png" alt="${brawlers[player.brawler].name}" />`;
								break;

							case "name":
								if (typeof player.name == "string") HTML += `<div class="name">${player.name}</div>`;
								break;
						}

						playerEl.innerHTML += HTML;
					};

					switch (battle.type) {
						case "soloRanked":
							display("rank");
							display("power");
							display("brawler");
							display("name");
							break;

						case "ranked":
							display("trophies");
							display("power");
							display("brawler");
							display("name");
							break;

						case "specialEvent":
							display("power");
							display("brawler");
							display("name");
							break;

						default:
							display("brawler");
							display("name");
							break;
					}

					teamEl.append(playerEl);
				};

				if (battle.teams) {
					for (const team of battle.teams) {
						const teamEl = document.createElement("div");
						teamEl.classList.add("team");
						for (const player of team) displayPlayer(player, teamEl);
						playersEl.append(teamEl);
					}
				} else if (battle.players) {
					const teamEl = document.createElement("div");
					teamEl.classList.add("team");
					for (const player of battle.players) displayPlayer(player, teamEl);
					playersEl.append(teamEl);
				}

				const date = new Date();
				date.setTime(typeof battle.date == "number" ? battle.date * 1000 : Date.now());
				const formattedDate = (date.getTime() < Date.now() - (24 * 60 * 60 * 1000) ? `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ` : "") + `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

				battleEl.innerHTML = `<div class="event">
	<img class="mode" src="/brawldata/assets/icon/mode/${battle.mode}.png" />
	<a class="name link" href="/brawldata/mode/${battle.mode}/">${{
						"soloShowdown": "Solo Showdown",
						"duoShowdown": "Duo Showdown",
						"gemGrab": "Gem Grab",
						"brawlBall": "Brawl Ball",
						"basketBrawl": "Basket Brawl",
						"hotZone": "Hot Zone",
						"roboRumble": "Robo Rumble",
						"bossFight": "Boss Fight"
					}[battle.mode] ?? toProperCase(String(battle.mode))}</a>
	<a class="map link" href="/brawldata/maps/${battle.map?.id ?? ""}/">${battle.map?.name ?? "Unknown map"}</a>
	<div class="result">${typeof battle.level == "string" && battle.result == "victory" ? `Challenge ${battle.level} cleared` : (typeof battle.result == "string" ? toProperCase(battle.result) : (typeof battle.rank == "number" ? `Rank ${battle.rank}` : ""))}</div>
	<div class="date">${formattedDate}</div>
</div>`;
				battleEl.append(playersEl);
				battlelog.append(battleEl);

				if (battle.type != "friendly") {
					if (typeof battle.rank == "number") {
						if (battle.rank == 1) showdownVictories.count++;
						showdownVictories.total++;
					} else if (typeof battle.result == "string") {
						if (battle.result == "victory") victories.count++;
						victories.total++;

						if (battle.starPlayer == "#" + id) starPlayer.count++;
						starPlayer.total++;
					}
				}
			}

			const battleEls = battlelog.querySelectorAll(".battle");
			document.querySelector("#battlecount").innerHTML = battleEls.length;
			if (victories.total > 0) document.querySelector("#victories").innerHTML = victories.percentage;
			if (starPlayer.total > 0) document.querySelector("#starPlayer").innerHTML = starPlayer.percentage;
			if (showdownVictories.total > 0) document.querySelector("#showdownVictories").innerHTML = showdownVictories.percentage;
		};

		const loadButton = document.querySelector("#load");

		let count = 0;
		let downloading = false;
		let page = 0;
		const next = async () => {
			if (!downloading) {
				downloading = true;
				loadButton.setAttribute("disabled", true);

				const req = await request(`/players/${id}/battlelog/${page}`);

				if (req.response.code != 204) {
					displayBattles(req.response.items);
					count += req.response.items.length;

					downloading = false;
					loadButton.removeAttribute("disabled");
					loadButton.classList.remove("hidden");

					if (count >= Number(req.headers["count"])) loadButton.remove();
				} else loadButton.remove();

				page++;
			}
		};

		await next();
		loadButton.addEventListener("click", next);

		window.addEventListener("scroll", () => {
			const battles = battlelog.querySelectorAll(".battle");
			const lastBattle = battles[battles.length - 1];
			const rect = lastBattle.getBoundingClientRect();
			if (rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth)) next();
		});
	} else canvas.innerHTML = "An error occured.";
});