export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
};

class SlidingWindowRateLimiter {
  private store = new Map<string, { timestamps: number[] }>();

  // For production, replace with Redis ZADD/ZREMRANGEBYSCORE for distributed deployments
  checkLimit(clientId: string, routePrefix: string, windowMs: number, maxRequests: number): RateLimitResult {
    const key = `${clientId}:${routePrefix}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const entry = this.store.get(key) ?? { timestamps: [] };
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    const currentCount = entry.timestamps.length;
    const allowed = currentCount < maxRequests;

    if (allowed) {
      entry.timestamps.push(now);
    }

    const remaining = Math.max(0, maxRequests - entry.timestamps.length);
    const resetAt = entry.timestamps.length > 0 ? entry.timestamps[0] + windowMs : now + windowMs;
    const retryAfterMs = allowed ? 0 : Math.max(0, resetAt - now);

    this.store.set(key, entry);

    return { allowed, remaining, resetAt, retryAfterMs };
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();

