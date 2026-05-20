import type { NextFunction, Request, Response } from "express";

type RequestLoggerOptions = {
  excludePaths?: string[];
};

function shouldSkip(pathname: string, excludePaths: string[] = []): boolean {
  return excludePaths.some((excluded) => pathname.startsWith(excluded));
}

export function requestLogger(options: RequestLoggerOptions = {}) {
  const { excludePaths = [] } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    if (shouldSkip(req.path, excludePaths)) {
      return next();
    }

    const startMs = Date.now();

    res.on("finish", () => {
      const durationMs = Date.now() - startMs;
      const requestId = req.headers["x-request-id"];
      const forwardedFor = req.headers["x-forwarded-for"];
      const ip = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor?.split(",")[0]?.trim() || req.ip;
      const userAgent = req.headers["user-agent"] ?? "-";
      const requestIdValue = typeof requestId === "string" ? requestId : "-";

      console.log(
        `[request] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms ` +
          `rid=${requestIdValue} ip=${ip ?? "-"} ua="${userAgent}"`,
      );
    });

    next();
  };
}

