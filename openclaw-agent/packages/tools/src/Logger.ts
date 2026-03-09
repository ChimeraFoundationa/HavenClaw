/**
 * Logger - Structured logging for agents
 */

import winston, { format } from 'winston';

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  agentId?: string;
}

export class Logger {
  private logger: winston.Logger;
  private context: Record<string, any>;

  constructor(config: LoggerConfig) {
    const logFormat =
      config.format === 'json'
        ? format.combine(format.timestamp(), format.json())
        : format.combine(
            format.timestamp(),
            format.colorize(),
            format.printf(({ level, message, timestamp, ...meta }) => {
              const contextStr = Object.keys(meta).length
                ? ` ${JSON.stringify(meta)}`
                : '';
              return `${timestamp as string} [${level}]: ${message}${contextStr}`;
            })
          );

    this.logger = winston.createLogger({
      level: config.level,
      format: logFormat,
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'agent.log' }),
      ],
      defaultMeta: config.agentId ? { agentId: config.agentId } : {},
    });

    this.context = {};
  }

  setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
    this.logger.defaultMeta = { ...this.logger.defaultMeta, ...this.context };
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, error?: Error, meta?: any): void {
    this.logger.error(message, { ...meta, error: error?.message });
  }

  child(meta: Record<string, any>): Logger {
    const childLogger = new Logger({
      level: this.logger.level as LoggerConfig['level'],
      format: this.logger.format === format.json() ? 'json' : 'text',
      agentId: this.context.agentId,
    });
    childLogger.setContext({ ...this.context, ...meta });
    return childLogger;
  }
}
