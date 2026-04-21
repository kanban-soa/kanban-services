import { pgTable, timestamp, boolean , varchar, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";


export const users = pgTable("users", {
  id: uuid("id").notNull().primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: varchar("image", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt").notNull().default(sql`CURRENT_TIMESTAMP`),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
});
