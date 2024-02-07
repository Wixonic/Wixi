class Format {
	static size = (size) => {
		switch (true) {
			case size > 10 ** 12:
				return `${Number((size / (10 ** 12)).toFixed(1))} TB`;

			case size > 10 ** 9:
				return `${Number((size / (10 ** 9)).toFixed(1))} GB`;

			case size > 10 ** 6:
				return `${Number((size / (10 ** 6)).toFixed(1))} MB`;

			case size > 10 ** 3:
				return `${Number((size / (10 ** 3)).toFixed(1))} kB`;

			default:
				return `${Math.ceil(size)} B`;
		}
	};
};

module.exports = { Format };