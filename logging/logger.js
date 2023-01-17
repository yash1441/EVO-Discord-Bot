const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize, errors } = format;

const timezoned = () => {
	return new Date().toLocaleString("en-US", {
		timeZone: "Asia/Kolkata",
	});
};

const options = {
	console: {
		level: "debug",
		colorize: true,
		format: combine(
			colorize(),
			timestamp({
				format: timezoned,
			}),
			printf((info) => `-> ${info.timestamp}\t${info.level}\n${info.message}`)
		),
	},
	file: {
		level: "info",
		filename: "./logging/log.log",
		colorize: false,
		format: combine(
			timestamp({
				format: timezoned,
			}),
			errors({ stack: true }),
			printf(
				(info) =>
					`-> ${info.timestamp}\t${info.level}\n${info.stack || info.message}`
			)
		),
	},
	errorFile: {
		level: "error",
		filename: "./logging/error.log",
		colorize: false,
		format: combine(
			timestamp({
				format: timezoned,
			}),
			errors({ stack: true }),
			printf(
				(info) =>
					`-> ${info.timestamp}\t${info.level}\n${info.stack || info.message}`
			)
		),
	},
};

const logger = createLogger({
	level: "debug",
	transports: [
		new transports.Console(options.console),
		new transports.File(options.file),
		new transports.File(options.errorFile),
	],
});

module.exports = logger;
