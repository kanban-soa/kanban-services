import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { boards } from "./boards";
import { workspaceRoles } from "./permissions";
import { workspaceMembers } from "./members";
import { memberRoleEnum, memberStatusEnum } from "./members";

export const workspacePlans = ["free", "pro", "enterprise"] as const;
export type WorkspacePlan = (typeof workspacePlans)[number];
export const workspacePlanEnum = pgEnum("workspace_plan", workspacePlans);

export const workspaces = pgTable(
  "workspace",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    plan: workspacePlanEnum("plan").notNull().default("free"),
    showEmailsToMembers: boolean("showEmailsToMembers")
      .notNull()
      .default(true),
    createdBy: uuid("createdBy").notNull(), // Soft link to Auth Service
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt"),
    deletedAt: timestamp("deletedAt"),
    deletedBy: uuid("deletedBy"), // Soft link to Auth Service
  },
  (table) => [
    index("workspace_created_by_idx").on(table.createdBy),
    index("workspace_deleted_by_idx").on(table.deletedBy),
    index("workspace_deleted_at_idx").on(table.deletedAt),
  ],
).enableRLS();

export const workspaceRelations = relations(
  workspaces,
  ({ many }) => ({
    members: many(workspaceMembers),
    boards: many(boards),
    roles: many(workspaceRoles),
  }),
);

