
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import  dotenv  from 'dotenv';
dotenv.config();
const { Pool } = pg;


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
export type Database = typeof db;

export default pool;

