import dotenv from 'dotenv';

dotenv.config();

interface GatewayConfig {
  port: number;
  nodeEnv: string;
  jwt: {
    secret: string;
  };
  services: {
    auth: string;
    workspace: string;
    board: string;
    noti: string;
    statistic: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origins: string[];
  };
  upstreamTimeoutMs: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config: GatewayConfig = {
  port: Number(process.env.GATEWAY_PORT ?? 8080),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwt: {
    secret: requireEnv('JWT_SECRET'),
  },
  services: {
    auth: requireEnv('AUTH_SERVICE_URL'),
    workspace: requireEnv('WORKSPACE_SERVICE_URL'),
    board: requireEnv('BOARD_SERVICE_URL'),
    noti: requireEnv('NOTI_SERVICE_URL'),
    statistic: requireEnv('STATISTIC_SERVICE_URL'),
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
  },
  cors: {
    origins: (process.env.CORS_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean),
  },
  upstreamTimeoutMs: Number(process.env.UPSTREAM_TIMEOUT_MS ?? 10_000),
};

export type { GatewayConfig };
export default config;

