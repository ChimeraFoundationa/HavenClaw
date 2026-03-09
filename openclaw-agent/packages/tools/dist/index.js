// src/Logger.ts
import winston, { format } from "winston";
var Logger = class _Logger {
  logger;
  context;
  constructor(config) {
    const logFormat = config.format === "json" ? format.combine(format.timestamp(), format.json()) : format.combine(
      format.timestamp(),
      format.colorize(),
      format.printf(({ level, message, timestamp, ...meta }) => {
        const contextStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
        return `${timestamp} [${level}]: ${message}${contextStr}`;
      })
    );
    this.logger = winston.createLogger({
      level: config.level,
      format: logFormat,
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "agent.log" })
      ],
      defaultMeta: config.agentId ? { agentId: config.agentId } : {}
    });
    this.context = {};
  }
  setContext(context) {
    this.context = { ...this.context, ...context };
    this.logger.defaultMeta = { ...this.logger.defaultMeta, ...this.context };
  }
  debug(message, meta) {
    this.logger.debug(message, meta);
  }
  info(message, meta) {
    this.logger.info(message, meta);
  }
  warn(message, meta) {
    this.logger.warn(message, meta);
  }
  error(message, error, meta) {
    this.logger.error(message, { ...meta, error: error?.message });
  }
  child(meta) {
    const childLogger = new _Logger({
      level: this.logger.level,
      format: this.logger.format === format.json() ? "json" : "text",
      agentId: this.context.agentId
    });
    childLogger.setContext({ ...this.context, ...meta });
    return childLogger;
  }
};
export {
  Logger
};
