import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import config from '../config/env';
import { rateLimiter } from '../lib/rate-limiter';
import { sendGatewayError } from '../utils/response';

export function rateLimitMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const route = req.matchedRoute;
  if (!route) {
    next();
    return;
  }

  const { windowMs, maxRequests } = route.rateLimit ?? config.rateLimit;
  const clientId = req.user?.id ?? req.ip ?? 'anon';
  const result = rateLimiter.checkLimit(clientId, route.prefix, windowMs, maxRequests);

  res.setHeader('X-RateLimit-Limit', maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());

  if (!result.allowed) {
    const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
    res.setHeader('Retry-After', retryAfterSeconds.toString());
    sendGatewayError(res, req, 429, 'rate_limit_exceeded', 'Too many requests', {
      retryAfterSeconds,
    });
    return;
  }

  next();
}

