import {
  createLogger,
  format as f,
  Logger as WinstonLogger,
  transports
} from "winston";

type LogFunction = (message: string, ...args: unknown[]) => Logger;

export type Logger = WinstonLogger & {
  beginDebug: LogFunction;
  continueDebug: LogFunction;
  continueWarn: LogFunction;
  continueError: LogFunction;
};

const format = f.combine(
  f.timestamp({ format: "YYYY-MM-DD hh:mm:ss:ms A" }),
  f.splat(),
  f.printf(
    ({ level, message, timestamp }) =>
      `${`[${level}]`.padStart(7)} ${timestamp} ${message}`
  )
);

const logger = createLogger({
  level: process.env.LOG_LEVEL,
  transports: [new transports.Console({ format })]
}) as Logger;

logger.beginDebug = function beginDebug(message, ...args): Logger {
  logger.debug(`${message}:`, ...args);
  return this;
};

logger.continueDebug = function continueDebug(message, ...args): Logger {
  logger.debug(`  - ${message}`, ...args);
  return this;
};

logger.continueWarn = function continueWarn(message, ...args): Logger {
  logger.warn(`  - ${message}`, ...args);
  return this;
};

logger.continueError = function continueError(message, ...args): Logger {
  logger.error(`  - ${message}`, ...args);
  return this;
};

export default logger;
