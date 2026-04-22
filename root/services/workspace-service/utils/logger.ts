import config from "../config/env";

/**
 * Log Levels
 */
export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

/**
 * Logger Class
 * Handles all logging for the Workspace Service
 */
class Logger {
  private logLevel: LogLevel;

  constructor() {
    const levelMap: Record<string, LogLevel> = {
      error: LogLevel.ERROR,
      warn: LogLevel.WARN,
      info: LogLevel.INFO,
      debug: LogLevel.DEBUG,
    };

    this.logLevel = levelMap[config.logLevel] || LogLevel.INFO;
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    if (data) {
      return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`;
    }

    return `${prefix} ${message}`;
  }

  /**
   * Check if log level should be printed
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex <= currentIndex;
  }

  /**
   * Log error message
   */
  error(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, data));
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, data));
    }
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message, data));
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(method: string, path: string, userId?: string): void {
    const message = `${method} ${path}${userId ? ` - User: ${userId}` : ""}`;
    this.info(message);
  }

  /**
   * Log HTTP response
   */
  logResponse(statusCode: number, message: string, duration: number): void {
    this.info(`${statusCode} ${message} (${duration}ms)`);
  }

  /**
   * Log database operation
   */
  logDatabase(operation: string, table: string, duration: number, data?: any): void {
    const message = `[DB] ${operation} on ${table} (${duration}ms)`;
    this.debug(message, data);
  }

  /**
   * Log error with stack trace
   */
  logErrorWithStackTrace(message: string, error: Error): void {
    this.error(message, {
      message: error.message,
      stack: error.stack,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

export default logger;
