import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { workspaceRoles } from "./permissions";
import { workspaces } from "./workspaces";

export const memberRoles = ["admin", "member", "guest"] as const;
export type MemberRole = (typeof memberRoles)[number];
export const memberRoleEnum = pgEnum("role", memberRoles);

export const memberStatuses = [
  "invited",
  "active",
  "removed",
  "paused",
] as const;
export type MemberStatus = (typeof memberStatuses)[number];
export const memberStatusEnum = pgEnum("member_status", memberStatuses);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    publicId: varchar("publicId", { length: 12 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull(),
    userId: uuid("userId"), // Soft link to Auth Service
    workspaceId: bigint("workspaceId", { mode: "number" })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    createdBy: uuid("createdBy").notNull(), // Soft link to Auth Service
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt"),
    deletedAt: timestamp("deletedAt"),
    deletedBy: uuid("deletedBy"), // Soft link to Auth Service
    role: memberRoleEnum("role").notNull(),
    roleId: bigint("roleId", { mode: "number" }).references(
      () => workspaceRoles.id,
      { onDelete: "restrict" },
    ),
    status: memberStatusEnum("status").default("invited").notNull(),
  },
  (table) => [
    index("workspace_members_workspace_idx").on(table.workspaceId),
    index("workspace_members_user_idx").on(table.userId),
    index("workspace_members_role_idx").on(table.roleId),
    index("workspace_members_deleted_at_idx").on(table.deletedAt),
    index("workspace_members_created_by_idx").on(table.createdBy),
    index("workspace_members_deleted_by_idx").on(table.deletedBy),
  ],
).enableRLS();

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
      relationName: "workspaceMembersWorkspace",
    }),
    workspaceRole: one(workspaceRoles, {
      fields: [workspaceMembers.roleId],
      references: [workspaceRoles.id],
      relationName: "workspaceMemberRole",
    }),
  }),
);
