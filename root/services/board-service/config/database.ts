import pg from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly from the board-service root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
const { Pool } = pg;

if (!process.env.BOARD_URL) {
  throw new Error('BOARD_URL environment variable is not set');
}

export const pool = new Pool({
  connectionString: process.env.BOARD_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, {schema});

export default pool;
