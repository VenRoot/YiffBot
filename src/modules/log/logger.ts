import winston from "winston";
import path from "path";


const logPath = process.env.DOCKER ? "/app/logs/" : path.join(__dirname, "../../../logs/");



const createLogger = (label: string) => winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.label({ label }),
        winston.format.timestamp(),
        winston.format.splat(),
        myFormat,
    ),
    // defaultMeta: { service: "user-service" },
    transports: [
        new winston.transports.File({ filename: path.join(logPath, "error.log"), level: "error" }),
        new winston.transports.File({ filename: path.join(logPath, "warn.log"), level: "warning" }),
        new winston.transports.File({ filename: path.join(logPath, "combined.log") }),
    ],
});

const myFormat = winston.format.printf(({ level, message, timestamp}) => {
    return `${timestamp} ${level}: ${message}`;
});

export default createLogger;