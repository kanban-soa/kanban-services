import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { boards } from "./boards";
import { labels } from "./labels";
import { lists } from "./lists";
import { users } from "./users";
import { workspaceMembers } from "./workspaces";

export const activityTypes = [
  "card.created",
  "card.updated.title",
  "card.updated.description",
  "card.updated.index",
  "card.updated.list",
  "card.updated.label.added",
  "card.updated.label.removed",
  "card.updated.member.added",
  "card.updated.member.removed",
  "card.updated.comment.added",
  "card.updated.comment.updated",
  "card.updated.comment.deleted",
  // Checklist activities
  "card.updated.checklist.added",
  "card.updated.checklist.renamed",
  "card.updated.checklist.deleted",
  "card.updated.checklist.item.added",
  "card.updated.checklist.item.updated",
  "card.updated.checklist.item.completed",
  "card.updated.checklist.item.uncompleted",
  "card.updated.checklist.item.deleted",
  "card.updated.attachment.added",
  "card.updated.attachment.removed",
  "card.updated.dueDate.added",
  "card.updated.dueDate.updated",
  "card.updated.dueDate.removed",
  "card.archived",
] as const;

export type ActivityType = (typeof activityTypes)[number];

export const activityTypeEnum = pgEnum("card_activity_type", activityTypes);

export const cards = pgTable("card", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  publicId: varchar("publicId", { length: 12 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  index: integer("index").notNull(),
  createdBy: uuid("createdBy").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt"),
  deletedAt: timestamp("deletedAt"),
  deletedBy: uuid("deletedBy").references(() => users.id, {
    onDelete: "set null",
  }),
  listId: bigint("listId", { mode: "number" })
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  importId: bigint("importId", { mode: "number" }),
  dueDate: timestamp("dueDate"),
}).enableRLS();

export const cardsRelations = relations(cards, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [cards.createdBy],
    references: [users.id],
    relationName: "cardsCreatedByUser",
  }),
  list: one(lists, {
    fields: [cards.listId],
    references: [lists.id],
    relationName: "cardsList",
  }),
  deletedBy: one(users, {
    fields: [cards.deletedBy],
    references: [users.id],
    relationName: "cardsDeletedByUser",
  }),
  labels: many(cardsToLabels),
  members: many(cardToWorkspaceMembers),
  activities: many(cardActivities),
}));

export const cardActivities = pgTable("card_activity", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  publicId: varchar("publicId", { length: 12 }).notNull().unique(),
  type: activityTypeEnum("type").notNull(),
  cardId: bigint("cardId", { mode: "number" })
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  fromIndex: integer("fromIndex"),
  toIndex: integer("toIndex"),
  fromListId: bigint("fromListId", { mode: "number" }).references(
    () => lists.id,
    { onDelete: "cascade" },
  ),
  toListId: bigint("toListId", { mode: "number" }).references(() => lists.id, {
    onDelete: "cascade",
  }),
  labelId: bigint("labelId", { mode: "number" }).references(() => labels.id, {
    onDelete: "cascade",
  }),
  workspaceMemberId: bigint("workspaceMemberId", {
    mode: "number",
  }).references(() => workspaceMembers.id, { onDelete: "set null" }),
  fromTitle: text("fromTitle"),
  toTitle: text("toTitle"),
  fromDescription: text("fromDescription"),
  toDescription: text("toDescription"),
  createdBy: uuid("createdBy").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  commentId: bigint("commentId", { mode: "number" }),
  fromComment: text("fromComment"),
  toComment: text("toComment"),
  fromDueDate: timestamp("fromDueDate"),
  toDueDate: timestamp("toDueDate"),
  sourceBoardId: bigint("sourceBoardId", { mode: "number" }).references(
    () => boards.id,
    { onDelete: "set null" },
  ),
  attachmentId: bigint("attachmentId", { mode: "number" }),
}).enableRLS();

export const cardActivitiesRelations = relations(cardActivities, ({ one }) => ({
  card: one(cards, {
    fields: [cardActivities.cardId],
    references: [cards.id],
    relationName: "cardActivitiesCard",
  }),
  fromList: one(lists, {
    fields: [cardActivities.fromListId],
    references: [lists.id],
    relationName: "cardActivitiesFromList",
  }),
  toList: one(lists, {
    fields: [cardActivities.toListId],
    references: [lists.id],
    relationName: "cardActivitiesToList",
  }),
  label: one(labels, {
    fields: [cardActivities.labelId],
    references: [labels.id],
    relationName: "cardActivitiesLabel",
  }),
  workspaceMember: one(workspaceMembers, {
    fields: [cardActivities.workspaceMemberId],
    references: [workspaceMembers.id],
    relationName: "cardActivitiesWorkspaceMember",
  }),
  user: one(users, {
    fields: [cardActivities.createdBy],
    references: [users.id],
    relationName: "cardActivitiesUser",
  }),
  member: one(workspaceMembers, {
    fields: [cardActivities.workspaceMemberId],
    references: [workspaceMembers.id],
    relationName: "cardActivitiesMember",
  }),
}));

export const cardsToLabels = pgTable(
  "_card_labels",
  {
    cardId: bigint("cardId", { mode: "number" })
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    labelId: bigint("labelId", { mode: "number" })
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.labelId] })],
).enableRLS();

export const cardToLabelsRelations = relations(cardsToLabels, ({ one }) => ({
  card: one(cards, {
    fields: [cardsToLabels.cardId],
    references: [cards.id],
    relationName: "cardToLabelsCard",
  }),
  label: one(labels, {
    fields: [cardsToLabels.labelId],
    references: [labels.id],
    relationName: "cardToLabelsLabel",
  }),
}));

export const cardToWorkspaceMembers = pgTable(
  "_card_workspace_members",
  {
    cardId: bigint("cardId", { mode: "number" })
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    workspaceMemberId: bigint("workspaceMemberId", { mode: "number" })
      .notNull()
      .references(() => workspaceMembers.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.workspaceMemberId] })],
).enableRLS();

export const cardToWorkspaceMembersRelations = relations(
  cardToWorkspaceMembers,
  ({ one }) => ({
    card: one(cards, {
      fields: [cardToWorkspaceMembers.cardId],
      references: [cards.id],
      relationName: "cardToWorkspaceMembersCard",
    }),
    member: one(workspaceMembers, {
      fields: [cardToWorkspaceMembers.workspaceMemberId],
      references: [workspaceMembers.id],
      relationName: "cardToWorkspaceMembersMember",
    }),
  }),
);
