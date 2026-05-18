import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import config from "@activity-service/config/env";
import "dotenv/config";

const pool = new Pool({
  connectionString: config.database.url,
});

pool.connect().then(() => {
  console.log("Activity service connected to database");
}).catch((error) => {
  console.error("Activity service database connection error", error);
});

export const db = drizzle(pool);

