import fs from "fs";
import path from "path";
import winston from "winston";

//      LOGS FOLDER CREATION

const logDirectory = path.resolve("logs");

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, {
    recursive: true,
  });
}

//         CUSTOM LOG FORMAT

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),

  winston.format.errors({
    stack: true,
  }),

  winston.format.printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `[${timestamp}] ${level.toUpperCase()}: ${stack}`
      : `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }),
);

//            CREATE LOGGER

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",

  format: logFormat,

  transports: [
    new winston.transports.File({
      filename: path.join(logDirectory, "combined.log"),
    }),

    new winston.transports.File({
      filename: path.join(logDirectory, "error.log"),
      level: "error",
    }),
  ],
});

//            CONSOLE LOGGING IN DEVELOPMENT

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),

        logFormat,
      ),
    }),
  );
}

export default logger;
