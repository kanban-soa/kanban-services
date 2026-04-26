type LogFields = Record<string, unknown>;

type RequestLogEntry = {
  requestId: string;
  method: string;
  path: string;
  routePrefix: string;
  clientId: string;
  statusCode: number;
  durationMs: number;
  userAgent?: string;
};

class Logger {
  private write(level: string, message: string, fields?: LogFields): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: 'api-gateway',
      message,
      ...(fields ?? {}),
    };
    process.stdout.write(`${JSON.stringify(entry)}\n`);
  }

  info(message: string, fields?: LogFields): void {
    this.write('info', message, fields);
  }

  warn(message: string, fields?: LogFields): void {
    this.write('warn', message, fields);
  }

  error(message: string, fields?: LogFields): void {
    this.write('error', message, fields);
  }

  logRequest(entry: RequestLogEntry): void {
    this.write('info', 'request_completed', entry);
  }
}

export const logger = new Logger();
export type { RequestLogEntry };

