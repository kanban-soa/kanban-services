import { relations, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { workspaces } from "./workspaces";

export const boardVisibilityStatuses = ["private", "public"] as const;
export type BoardVisibilityStatus = (typeof boardVisibilityStatuses)[number];
export const boardVisibilityEnum = pgEnum(
  "board_visibility",
  boardVisibilityStatuses,
);

export const boardTypes = ["regular", "template"] as const;
export type BoardType = (typeof boardTypes)[number];
export const boardTypeEnum = pgEnum("board_type", boardTypes);

export const boards = pgTable(
  "board",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 255 }).notNull(),
    createdBy: uuid("createdBy"), // Soft link to Auth Service
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt"),
    deletedAt: timestamp("deletedAt"),
    deletedBy: uuid("deletedBy"), // Soft link to Auth Service
    importId: bigint("importId", { mode: "number" }),
    workspaceId: bigint("workspaceId", { mode: "number" })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    visibility: boardVisibilityEnum("visibility").notNull().default("private"),
    type: boardTypeEnum("type").notNull().default("regular"),
    sourceBoardId: bigint("sourceBoardId", { mode: "number" }),
  },
  (table) => [
    index("board_visibility_idx").on(table.visibility),
    index("board_type_idx").on(table.type),
    index("board_source_idx").on(table.sourceBoardId),
    index("board_workspace_idx").on(table.workspaceId),
    index("board_created_by_idx").on(table.createdBy),
    index("board_deleted_by_idx").on(table.deletedBy),
    uniqueIndex("unique_slug_per_workspace")
      .on(table.workspaceId, table.slug)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
).enableRLS();

export const boardsRelations = relations(boards, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [boards.workspaceId],
    references: [workspaces.id],
    relationName: "boardWorkspace",
  }),
}));
