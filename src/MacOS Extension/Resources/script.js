const extensions = [
    { // https://github.com/:owner/:repository[/:details]
        matches: [
            /^https:\/\/github\.com\/([\w-]+)\/([\w-]+)/m
        ],
        run: (url, owner, repository) => {
            sendStatus("POST", "/github", {
                type: "repository",
                owner,
                repository,
                url: `https://github.com/${owner}/${repository}`
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
        run: (url, profile) => {
            sendStatus("POST", "/github", {
                type: "profile",
                profile,
                url: `https://github.com/${profile}`
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
        run: (url) => {
            sendStatus("POST", "/website", {
                type: "desktop",
                url
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
                return;
            }
        }
    }
});
