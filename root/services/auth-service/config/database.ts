import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/auth-service/schema';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

/**
 * Singleton (Creational): a single owner of the Postgres pool and the drizzle
 * client for the whole auth-service. `getInstance()` lazily builds the
 * connection exactly once and hands back the same instance on every call.
 */
class Database {
  private static instance: Database | null = null;

  readonly pool: pg.Pool;
  readonly db: NodePgDatabase<typeof schema>;

  private constructor() {
    if (!process.env.AUTH_URL) {
      throw new Error('AUTH_URL environment variable is not set');
    }

    this.pool = new Pool({
      connectionString: process.env.AUTH_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.db = drizzle(this.pool, { schema });
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

const instance = Database.getInstance();

// Backward-compatible exports — same names/shapes as before.
export const pool = instance.pool;
export const db = instance.db;

export { Database };
export default pool;
