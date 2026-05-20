import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import * as schema from '../schema';
import dotenv from 'dotenv';
dotenv.config();
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

export const db = drizzle(pool, { schema });
export type Database = typeof db;

type Schema = typeof schema;
type Relations = ExtractTablesWithRelations<Schema>;
export type BoardDbTransaction = PgTransaction<NodePgQueryResultHKT, Schema, Relations>;
export type DbOrTx = Database | BoardDbTransaction;

export default pool;
