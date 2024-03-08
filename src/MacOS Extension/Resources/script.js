const extensions = [
    { // https://github.com/:owner/:repository[/:details]
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
    }, { // https://github.com/:profile[/:details]
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
    }, { // https://[*.]wixonic.fr
        matches: [
            /^https?:\/\/(?:\w+\.)*wixonic\.fr(?:\:\d+)?(?:\/\w+\/?)*(?:\#|\?)?(?:\w|\=|\&)*$/m
        ],
        run: (_) => {
            sendStatus("POST", "/website", {
                type: "desktop"
            });

            onUnload.path = "/website";
            onUnload.data = {
                type: "desktop"
            };
        }
    }
];

const sendStatus = (method = "POST", path = "/", data = {}) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, new URL(path, "https://server.wixonic.fr:4000"));
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Server-Keep-Alive", "10");
    xhr.send(JSON.stringify(data));
};

const onUnload = {
    data: null,
    path: null
};

window.addEventListener("beforeunload", () => sendStatus("DELETE", onUnload.path, onUnload.data));
window.addEventListener("load", () => {
    const url = location.href;

    for (const extension of extensions) {
        for (const match of extension.matches) {
            const results = match.exec(url);

            if (results?.length > 0) {
                extension.run(...results);
                setInterval(() => extension.run(...results), 9000);
                return;
            }
        }
    }
});
