import { relations, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { labels, lists } from "@/board-service/schema/";

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
    createdBy: uuid("createdBy"), // userid reference in auth service
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt"),
    deletedAt: timestamp("deletedAt"),
    deletedBy: uuid("deletedBy"), // userid reference in auth service
    importId: bigint("importId", { mode: "number" }),
    workspaceId: bigint("workspaceId", { mode: "number" }).notNull(),
    visibility: boardVisibilityEnum("visibility").notNull().default("private"),
    type: boardTypeEnum("type").notNull().default("regular"),
    sourceBoardId: bigint("sourceBoardId", { mode: "number" }),
  },
  (table) => [
    index("board_visibility_idx").on(table.visibility),
    index("board_type_idx").on(table.type),
    index("board_source_idx").on(table.sourceBoardId),
    uniqueIndex("unique_slug_per_workspace")
      .on(table.workspaceId, table.slug)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
).enableRLS();

export const boardsRelations = relations(boards, ({  many }) => ({
  userFavorites: many(userBoardFavorites),
  lists: many(lists),
  allLists: many(lists),
  labels: many(labels),
}));

export const userBoardFavorites = pgTable(
  "user_board_favorites",
  {
    userId: uuid("userId").notNull(),
    boardId: bigint("boardId", { mode: "number" })
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.boardId] }),
    userIdx: index("user_board_favorite_user_idx").on(table.userId),
    boardIdx: index("user_board_favorite_board_idx").on(table.boardId),
  }),
);
