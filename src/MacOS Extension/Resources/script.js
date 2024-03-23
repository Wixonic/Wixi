(() => {
    const extensions = [
        { // https://github.com/:owner/:repository[:anything]
            matches: [
                /^https:\/\/github\.com\/([\w-]+)\/([\w-]+)/m
            ],
            run: (_, owner, repository) => {
                sendStatus("POST", "/github", {
                    type: "repository",
                    owner,
                    repository
                });

                onUnload.path = "/github";
                onUnload.data = {
                    type: "repository"
                };
            }
        }, { // https://github.com/:profile[:anything]
            matches: [
                /^https:\/\/github\.com\/([\w-]+)/m
            ],
            run: (_, profile) => {
                sendStatus("POST", "/github", {
                    type: "profile",
                    profile
                });

                onUnload.path = "/github";
                onUnload.data = {
                    type: "profile"
                };
            }
        }, { // https://[*.]github.com[:anything]
            matches: [
                /^https:\/\/(?:[\w-]+\.)*github\.com/m
            ],
            run: (_) => {
                sendStatus("POST", "/github", {});

                onUnload.path = "/github";
                onUnload.data = {};
            }
        }, { // https://[*.]wixonic.fr[:anything]
            matches: [
                /^https:\/\/(?:[\w-]+\.)*wixonic\.fr/m
            ],
            run: (_) => {
                sendStatus("POST", "/website", {});

                onUnload.path = "/website";
                onUnload.data = {};
            }
        }, { // https://[*.]youtube.com/feed/subscriptions[:anything]
            matches: [
                /^https:\/\/(?:[\w-]+\.)*youtube\.com\/feed\/subscriptions/m
            ],
            run: (_) => {
                sendStatus("POST", "/youtube", {
                    type: "subscriptions"
                });

                onUnload.path = "/youtube";
                onUnload.data = {
                    type: "subscriptions"
                };
            }
        }, { // https://[*.]youtube.com/watch[:anything]
            matches: [
                /^https:\/\/(?:[\w-]+\.)*youtube.com\/watch/m
            ],
            run: (_) => {
                const dataScripts = document.querySelectorAll(`script[type="application/ld+json"]`);
                let data = {};

                for (let x = 0; x < dataScripts.length; ++x) {
                    try {
                        const dataScript = JSON.parse(dataScripts[x].innerHTML);

                        if (dataScript["@type"] == "VideoObject") {
                            data = dataScript;
                            break;
                        }
                    } catch { }
                }

                sendStatus("POST", "/youtube", {
                    type: "video",
                    author: data.author,
                    name: data.name,
                    thumbnail: (data.thumbnailUrl ?? [])[0]
                });

                onUnload.path = "/youtube";
                onUnload.data = {
                    type: "video"
                };
            }
        }, { // https://[*.]youtube.com
            matches: [
                /^https:\/\/(?:[\w-]+\.)*youtube\.com(?:\/)?$/m
            ],
            run: (_) => {
                sendStatus("POST", "/youtube", {
                    type: "home"
                });

                onUnload.path = "/youtube";
                onUnload.data = {
                    type: "home"
                };
            }
        }, { // https://[*.]firebase.google.com[:anything]
            matches: [
                /^https:\/\/(?:[\w-]+\.)*firebase\.google\.com/m
            ],
            run: (_) => {
                sendStatus("POST", "/firebase", {});

                onUnload.path = "/firebase";
                onUnload.data = {};
            }
        }
    ];

    const sendStatus = (method = "POST", path = "/", data = {}) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, new URL(path, "https://server.wixonic.fr:4000"));
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Server-Keep-Alive", "15");
        xhr.send(JSON.stringify(data));
    };

    const onUnload = {
        data: null,
        path: null
    };

    const check = () => {
        const url = location.href;

        for (const extension of extensions) {
            for (const match of extension.matches) {
                const results = match.exec(url);

                if (results?.length > 0) {
                    try {
                        extension.run(...results);
                        console.log(onUnload);
                    } catch (e) {
                        console.warn(e);
                    }
                    return;
                }
            }
        }
    };

    check();
    setInterval(check, 10000);
    window.addEventListener("beforeunload", () => sendStatus("DELETE", onUnload.path, onUnload.data));
})()
