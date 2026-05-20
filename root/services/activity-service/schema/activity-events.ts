import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid, bigserial, bigint, varchar } from "drizzle-orm/pg-core";

export const activityEntityTypes = ["board", "card"] as const;
export type ActivityEntityType = (typeof activityEntityTypes)[number];
export const activityEntityTypeEnum = pgEnum("activity_entity_type", activityEntityTypes);

export const activityActionTypes = [
  "board.created",
  "board.deleted",
  "card.created",
  "card.deleted",
  "card.updated",
] as const;
export type ActivityActionType = (typeof activityActionTypes)[number];
export const activityActionTypeEnum = pgEnum("activity_action_type", activityActionTypes);

export const activityEvents = pgTable(
  "workspace_activity",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    workspaceId: bigint("workspaceId", { mode: "number" }).notNull(),
    actorUserId: uuid("actorUserId").notNull(),
    actionType: activityActionTypeEnum("actionType").notNull(),
    entityType: activityEntityTypeEnum("entityType").notNull(),
    entityId: varchar("entityId", { length: 64 }).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("workspace_activity_workspace_idx").on(table.workspaceId),
    index("workspace_activity_created_at_idx").on(table.createdAt),
    index("workspace_activity_action_idx").on(table.actionType),
  ],
);

