const path = require("path");

const { BaseObject } = require("./base");

const config = require("./config");
const request = require("./request");

class Client extends BaseObject {
	constructor(token) {
		super();

		this.token = token;
	};
};

class Token extends BaseObject {
	/**
	 * @param {String} code
	 * @returns Promise<Token>
	 */
	static getTokenFromCode = async (code) => new Token(await request({
		auth: `${config.clientId}:${config.clientSecret}`,
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: config.redirectUri
		}),
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		method: "POST",
		type: "json",
		url: new URL(path.join(config.endpointPath, "/oauth2/token"), config.endpointHost)
	}));

	constructor(token) {
		super();

		/**
		 * @type {Number}
		 */
		this.expiresAt = Date.now() + token.expires_in * 1000;

		/**
		 * @type {String}
		 */
		this.token = token.access_token;

		/**
		 * @type {NodeJS.Timeout?}
		 */
		this.refreshTimeout = null;

		this.cycle();
	};

	get expiresIn() {
		return this.expiresAt - Date.now();
	};

	get expired() {
		if (this.expiresIn <= 0) this.destroy("Token expired.");
		return this.destroyed != false;
	};

	cycle() {
		clearTimeout(this.cycleTimeout);

		if (!this.expired) this.cycleTimeout = setTimeout(() => this.refresh(), this.expiresIn - 10 * 1000);
	};

	async refresh() {
		clearTimeout(this.cycleTimeout);

		if (this.expired) throw "Cannot refresh the token after it expires.";

		const token = await request({
			auth: `${config.clientId}:${config.clientSecret}`,
			body: new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: this.token
			}),
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			method: "POST",
			type: "json",
			url: new URL(path.join(config.endpointPath, "/oauth2/token"), config.endpointHost)
		});

		this.expiresAt = Date.now() + token.expires_in * 1000;
		this.token = token.access_token;

		if (this.expired) this.destroy("Refresh failed.");

		this.cycle();

		this.log("Refreshed");
		return this.token;
	};

	async revoke() {
		clearTimeout(this.cycleTimeout);

		await request({
			auth: `${config.clientId}:${config.clientSecret}`,
			body: new URLSearchParams({
				token: this.token,
				token_type_hint: "access_token"
			}),
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			method: "POST",
			type: "json",
			url: new URL(path.join(config.endpointPath, "/oauth2/token/revoke"), config.endpointHost)
		});

		this.destroy("Revoked.");
	};
};

module.exports = {
	Client,
	Token
};