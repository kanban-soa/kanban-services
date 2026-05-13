import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
  };
  jwt: {
    secret: string;
  };
  logLevel: string;
  services: {
    authUrl: string;
    boardUrl: string;
    notificationUrl: string;
  };
}

function validateEnv(): Config {
  const requiredEnvs = ["WORKSPACE_URL", "JWT_SECRET"];
  
  const missing = requiredEnvs.filter((env) => !process.env[env]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  const port = parseInt(process.env.WORKSPACE_SERVICE_PORT || "3001", 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.WORKSPACE_SERVICE_PORT}. Must be between 1 and 65535`);
  }

  const nodeEnv = process.env.NODE_ENV || "development";
  const validEnvs = ["development", "production", "test"];
  if (!validEnvs.includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}. Must be one of: ${validEnvs.join(", ")}`);
  }

  const logLevel = process.env.LOG_LEVEL || "info";
  const validLogLevels = ["error", "warn", "info", "debug"];
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(
      `Invalid LOG_LEVEL: ${logLevel}. Must be one of: ${validLogLevels.join(", ")}`
    );
  }

  return {
    port,
    nodeEnv,
    database: {
      url: process.env.WORKSPACE_URL!,
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
    },
    logLevel,
    services: {
      authUrl: process.env.AUTH_SERVICE_URL || "http://localhost:9001",
      boardUrl: process.env.BOARD_SERVICE_URL || "http://localhost:9003",
      notificationUrl: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:9004",
    },
  };
}

const config = validateEnv();

export default config;
