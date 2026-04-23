import { pgTable, timestamp, boolean , varchar, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";


export const users = pgTable("users", {
  id: uuid("id").notNull().primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  emailVerified: boolean("emailVerified").notNull().default(false),
  password: varchar("password", { length: 255 }),
  image: varchar("image", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt").notNull().default(sql`CURRENT_TIMESTAMP`),
});
