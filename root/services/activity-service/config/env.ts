import dotenv from "dotenv";

dotenv.config();

interface ActivityConfig {
  port: number;
  database: {
    url: string;
  };
  services: {
    workspaceUrl: string;
  };
  retentionDays: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config: ActivityConfig = {
  port: Number(process.env.ACTIVITY_SERVICE_PORT ?? 9010),
  database: {
    url: requireEnv("ACTIVITY_URL"),
  },
  services: {
    workspaceUrl: process.env.WORKSPACE_SERVICE_URL || "http://localhost:9005",
    authUrl: process.env.AUTH_SERVICE_URL || "http://localhost:9001",
  },
  retentionDays: Number(process.env.ACTIVITY_RETENTION_DAYS ?? 7),
};

export type { ActivityConfig };
export default config;

