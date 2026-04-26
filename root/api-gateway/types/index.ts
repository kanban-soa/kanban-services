import type Express from 'express';

export interface RouteConfig {
  /** URL path prefix to match, e.g. '/api/v1/workspaces' */
  prefix: string;

  /** Full base URL of the target service, e.g. 'http://localhost:9005' */
  target: string;

  /**
   * Rewrite the path before proxying.
   * e.g. strip '/api/v1' so '/api/v1/workspaces' → '/workspaces'
   */
  rewrite?: (path: string) => string;

  /** Whether this route requires a valid JWT. Default: true */
  auth: boolean;

  /** Per-route rate limit override. Falls back to global config. */
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };

  /** HTTP methods allowed on this route. Undefined = all methods. */
  methods?: string[];
}

export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    iat?: number;
    exp?: number;
  };
  requestId: string;
  matchedRoute?: RouteConfig;
}

