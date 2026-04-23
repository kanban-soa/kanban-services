import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@/auth-service/schema';
import  dotenv  from 'dotenv';
dotenv.config();
const { Pool } = pg;

if (!process.env.AUTH_URL) {
  throw new Error('AUTH_URL environment variable is not set');
}

export const pool = new Pool({
  connectionString: process.env.AUTH_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, {schema});

export default pool;
