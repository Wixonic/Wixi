const extensions = [
    {
        matches: [
            /^https:\/\/github\.com\/([\w-]+)\/([\w-]+)(?:/([\w-]+))?/
        ],
        run: (url, owner, repo, details) => {
            sendStatus("POST", "/github", {
                type: "repository",
                owner,
				details,
                repository: repo,
                url: `https://github.com/${owner}/${repo}`
            });
            
            onUnload.path = "/github";
            onUnload.data = {
                type: "repository"
            };
        }
    }, {
        matches: [
            /^https:\/\/github\.com\/([\w-]+)(?:/([\w-]+))?/
        ],
        run: (url, profile, details) => {
            sendStatus("POST", "/github", {
                type: "profile",
                profile,
				details,
                url: `https://github.com/${profile}`
            });
            
            onUnload.path = "/github";
            onUnload.data = {
                type: "profile"
            };
        }
    }
];

const sendStatus = (method="POST", path="/", data={}) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, new URL(path, "https://server.wixonic.fr:4000"));
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(data));
};

const onUnload = {
    data: null,
    path: null
};

window.addEventListener("unload", () => sendStatus("DELETE", onUnload.path, onUnload.data));
window.addEventListener("load", () => {
    const url = location.href;
    
    for (const extension of extensions) {
        for (const match of extension.matches) {
            const results = match.exec(url);
			
            if (results.length > 0) {
                extension.run(...results);
                return;
            }
        }
    }
});
