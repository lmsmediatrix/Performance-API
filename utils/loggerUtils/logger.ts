import { createLogger, format, transports } from "winston";
import path from "path";
import DailyRotateFile from "winston-daily-rotate-file";
import dotenv from "dotenv";
import createBetterStackTransport from "../betterStackTransport";

dotenv.config();

const logsDir = path.join(process.cwd(), "logs");
const environment = process.env.NODE_ENV === "production" ? "production" : "development";
const isProduction = environment === "production";
const debugEnabled = process.env.DEBUG !== "false";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const consoleFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ level, message, timestamp, ...meta }) => {
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : "";
    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaString}`;
  }),
  format.colorize({ all: !isProduction })
);

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const onlyErrorAndInfo = format((info) => {
  return info.level === "error" || info.level === "info" ? info : false;
});

const createRotateFileTransport = () => {
  try {
    return new DailyRotateFile({
      filename: path.join(logsDir, "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: fileFormat,
    });
  } catch (error) {
    console.error(
      `Error creating daily rotate file transport: ${error instanceof Error ? error.message : String(error)}`
    );
    return new transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: fileFormat,
    });
  }
};

const betterStackTransport = createBetterStackTransport({
  sourceToken: process.env.BETTER_STACK_SOURCE_TOKEN || "kxfrR68kVimKNCrvNDmQpPo1",
  endpoint: process.env.BETTER_STACK_ENDPOINT || "https://s1331936.eu-nbg-2.betterstackdata.com",
});

const logger = createLogger({
  levels,
  level: "info",
  defaultMeta: {
    service: "lms-api",
    environment,
    version: process.env.npm_package_version || "1.0.0",
  },
  exitOnError: false,
  format: format.combine(onlyErrorAndInfo(), fileFormat),
  transports: [
    Object.assign(createRotateFileTransport(), { silent: !debugEnabled }),
    betterStackTransport,
    ...(!isProduction && debugEnabled
      ? [new transports.Console({ format: consoleFormat })]
      : []
    ).map((t) => Object.assign(t, { silent: !debugEnabled })),
  ],
});

const originalDebug = logger.debug.bind(logger);
logger.debug = debugEnabled ? originalDebug : () => logger;

export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

interface ExtendedRequest {
  id?: string;
  requestId?: string;
  method: string;
  path: string;
  query: any;
  body: any;
  ip: string;
  get: (header: string) => string | undefined;
}

export const logRequest = (req: ExtendedRequest, res: any, next: any) => {
  const requestId = req.requestId || req.id || Math.random().toString(36).substring(2, 15);
  const start = Date.now();
  req.requestId = requestId;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "error" : "info";

    logger[logLevel]("Outgoing response", {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("Content-Length"),
    });
  });

  next();
};

export default logger;
