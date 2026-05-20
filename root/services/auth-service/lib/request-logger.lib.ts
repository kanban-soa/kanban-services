import { NextFunction, Request, Response } from "express";

export interface RequestLoggerOptions {
  ignorePaths?: string[];
}

const DEFAULT_IGNORE_PATHS = ["/health"];

export function requestLogger(options: RequestLoggerOptions = {}) {
  const ignorePaths = options.ignorePaths ?? DEFAULT_IGNORE_PATHS;

  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    const method = req.method;
    const path = req.originalUrl || req.url;
    const requestId = typeof req.headers["x-request-id"] === "string" ? req.headers["x-request-id"] : undefined;
    const ipHeader = req.headers["x-forwarded-for"];
    const ip = typeof ipHeader === "string" ? ipHeader.split(",")[0].trim() : req.ip;
    const userAgent = req.headers["user-agent"];
    const shouldIgnore = ignorePaths.some((p) => path.startsWith(p));

    if (!shouldIgnore) {
      console.info(`[REQ] ${method} ${path}`, {
        requestId,
        ip,
        userAgent,
      });
    }

    res.on("finish", () => {
      if (shouldIgnore) return;
      const durationMs = Number((process.hrtime.bigint() - start) / 1000000n);
      console.info(`[RES] ${method} ${path} ${res.statusCode} ${durationMs}ms`, {
        requestId,
      });
    });

    next();
  };
}

