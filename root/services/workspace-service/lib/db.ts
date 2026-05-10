import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.WORKSPACE_URL || process.env.AUTH_URL,
});

pool.connect().then(() => {
  console.log("Connected to database");
}).catch((error) => {
  console.error("Error connecting to database", error);
});

export const db = drizzle(pool);
