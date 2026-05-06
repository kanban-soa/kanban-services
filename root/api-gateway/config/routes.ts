import { RouteConfig } from '../types';
import config from './env';

export const routes: RouteConfig[] = [
  // ── Auth Service ──────────────────────────────────────────────────
  // Public: login and register do not require a JWT
  {
    prefix: '/api/v1/auth/login',
    target: config.services.auth,
    auth: false,
    methods: ['POST'],
    rewrite: (p) => p.replace('/api/v1/auth/login', '/api/users/login'),
  },
  {
    prefix: '/api/v1/auth/register',
    target: config.services.auth,
    auth: false,
    methods: ['POST'],
    rewrite: (p) => p.replace('/api/v1/auth/register', '/api/users'),
  },
  {
    prefix: '/api/v1/auth/verify-jwt',
    target: config.services.auth,
    auth: false,
    methods: ['POST'],
    rewrite: (p) => p.replace('/api/v1/auth/verify-jwt', '/api/sessions/verify-jwt'),
  },

  // ── Workspace Service ─────────────────────────────────────────────
  {
    prefix: '/api/v1/workspaces',
    target: config.services.workspace,
    auth: true,
    rewrite: (p) => p.replace('/api/v1', ''),
    rateLimit: { windowMs: 60_000, maxRequests: 120 },
  },

  // ── Board Service ─────────────────────────────────────────────────
  {
    prefix: '/api/v1/boards',
    target: config.services.board,
    auth: true,
    rewrite: (p) => p.replace('/api/v1', ''),
    rateLimit: { windowMs: 60_000, maxRequests: 200 },
  },

  // ── Notification Service ──────────────────────────────────────────
  {
    prefix: '/api/v1/notifications',
    target: config.services.noti,
    auth: true,
    rewrite: (p) => p.replace('/api/v1', '/v1'),
  },

  // ── Statistic Service ─────────────────────────────────────────────
  {
    prefix: '/api/v1/statistics',
    target: config.services.statistic,
    auth: false,
    rewrite: (p) => p.replace('/api/v1/statistics', '/api/v1/statistics'),
    rateLimit: { windowMs: 60_000, maxRequests: 60 },
  },
];

export function matchRoute(pathname: string): RouteConfig | undefined {
  return routes.find((r) => pathname.startsWith(r.prefix));
}

