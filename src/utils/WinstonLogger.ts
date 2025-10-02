import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import CloudWatchTransport from "./CloudWatchTransport.js";
import stringify from 'safe-stable-stringify';

const { combine, timestamp, errors, printf, colorize, json } = winston.format;

const isProd = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL || "info";

const devFormat = printf(({ timestamp, level, message, stack, ...meta }) => {
  const msg =
    typeof message === "object" ? stringify(message, null, 2) : message;
  const metaStr = Object.keys(meta).length
    ? `\n${stringify(meta, null, 2)}`
    : "";
  return `${timestamp} [${level}] ${stack || msg}${metaStr}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    level,
    format: isProd
      ? combine(timestamp(), errors({ stack: true }), json())
      : combine(colorize(), timestamp(), errors({ stack: true }), devFormat),
  }),
];

if (!isProd) {
  transports.push(
    new DailyRotateFile({
      level: "error",
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      zippedArchive: true,
      format: combine(
        timestamp(),
        errors({ stack: true }),
        printf(({ timestamp, level, message, stack, ...meta }) => {
          const msg =
            typeof message === "object"
              ? JSON.stringify(message, null, 2)
              : message;
          const metaStr = Object.keys(meta).length
            ? `\n${JSON.stringify(meta, null, 2)}`
            : "";
          return `${timestamp} [${level}] ${stack || msg}${metaStr}`;
        })
      ),
    })
  );

  transports.push(
    new DailyRotateFile({
      level: "info",
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      zippedArchive: true,
      format: combine(
        timestamp(),
        errors({ stack: true }),
        printf(({ timestamp, level, message, stack, ...meta }) => {
          const msg =
            typeof message === "object"
              ? JSON.stringify(message, null, 2)
              : message;
          const metaStr = Object.keys(meta).length
            ? `\n${JSON.stringify(meta, null, 2)}`
            : "";
          return `${timestamp} [${level}] ${stack || msg}${metaStr}`;
        })
      ),
    })
  );
}

if (isProd) {
  transports.push(
    new CloudWatchTransport({
      logGroupName: process.env.CLOUDWATCH_GROUP_NAME || "fintech-logs",
      logStreamName: `app-${new Date().toISOString().split("T")[0]}`, // log stream per day
      region: process.env.AWS_REGION || "ap-south-1",
    })
  );
}

const logger = winston.createLogger({
  level,
  format: combine(timestamp(), errors({ stack: true })),
  transports,
});

export default logger;
