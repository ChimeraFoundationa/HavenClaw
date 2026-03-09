/**
 * Logger - Structured logging for agents
 */
interface LoggerConfig {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    agentId?: string;
}
declare class Logger {
    private logger;
    private context;
    constructor(config: LoggerConfig);
    setContext(context: Record<string, any>): void;
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: Error, meta?: any): void;
    child(meta: Record<string, any>): Logger;
}

export { Logger, type LoggerConfig };
