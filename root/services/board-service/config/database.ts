import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import "dotenv/config";
import * as schema from "@/board-service/schema";

if (!process.env.BOARD_URL) {
  throw new Error("BOARD_URL environment variable is not set");
}

export const pool = new Pool({
  connectionString: process.env.BOARD_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

export default pool;

