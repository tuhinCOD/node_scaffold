import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

function formatMeta(meta: Record<string, unknown>): string {
	const parts: string[] = [];

	for (const [key, value] of Object.entries(meta)) {
		if (value instanceof Error) {
			parts.push(`${key}=${value.stack || value.message}`);
		} else if (typeof value === "object" && value !== null) {
			parts.push(`${key}=${JSON.stringify(value)}`);
		} else {
			parts.push(`${key}=${String(value)}`);
		}
	}

	return parts.length ? ` ${parts.join(" ")}` : "";
}

const logFormat = printf(({ level, message, timestamp, ...meta }) => {
	return `${timestamp} [${level}]: ${message}${formatMeta(meta)}`;
});

const logger = winston.createLogger({
	level: "info",
	format: combine(
		timestamp({
			format: "YYYY-MM-DD HH:mm:ss",
		}),
		logFormat,
	),
	transports: [
		new winston.transports.Console({
			format: combine(
				colorize(),
				timestamp({
					format: "YYYY-MM-DD HH:mm:ss",
				}),
				logFormat,
			),
		}),

		new winston.transports.File({
			filename: "src/storage/logs/combined.log",
		}),

		new winston.transports.File({
			filename: "src/storage/logs/error.log",
			level: "error",
		}),
	],
});

if (process.env.NODE_ENV !== "production") {
	logger.add(
		new winston.transports.Console({
			format: winston.format.simple(),
		}),
	);
}

export default logger;
