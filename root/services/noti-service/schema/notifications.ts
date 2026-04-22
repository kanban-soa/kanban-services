import { pgTable, timestamp, boolean , varchar, uuid, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";


export const notifications= pgTable("notifications", {
  id: uuid("id").notNull().primaryKey().default(sql`gen_random_uuid()`),
  publicId: varchar("publicId", { length: 12 }).notNull().unique(),
  type: varchar("type", { length: 255 }).notNull(),
  userId: uuid("userId").notNull(),
  cardId: uuid("cardId").notNull(),
  commentId: uuid("commentId").notNull(),
  workspaceId: uuid("workspaceId").notNull(),
  metadata: text("metadata"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().default(sql`now()`),
  deletedAt: timestamp("deletedAt"),
});
