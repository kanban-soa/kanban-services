import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@activity-service/lib/db";
import { activityEvents } from "@activity-service/schema";

export interface CreateActivityInput {
  publicId: string;
  workspaceId: number;
  actorUserId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
}

export interface ActivityQuery {
  workspaceId: number;
  actionType?: string;
  entityType?: string;
  actorUserId?: string;
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
}

export class ActivityRepository {
  async create(input: CreateActivityInput) {
    const [event] = await db.insert(activityEvents).values(input).returning();
    return event;
  }

  async list(query: ActivityQuery) {
    const conditions = [eq(activityEvents.workspaceId, query.workspaceId)];

    if (query.actionType) {
      conditions.push(eq(activityEvents.actionType, query.actionType));
    }
    if (query.entityType) {
      conditions.push(eq(activityEvents.entityType, query.entityType));
    }
    if (query.actorUserId) {
      conditions.push(eq(activityEvents.actorUserId, query.actorUserId));
    }
    if (query.from) {
      conditions.push(gte(activityEvents.createdAt, query.from));
    }
    if (query.to) {
      conditions.push(lte(activityEvents.createdAt, query.to));
    }

    return db
      .select()
      .from(activityEvents)
      .where(and(...conditions))
      .orderBy(desc(activityEvents.createdAt))
      .limit(query.limit)
      .offset(query.offset);
  }

  async count(query: Omit<ActivityQuery, "limit" | "offset">) {
    const conditions = [eq(activityEvents.workspaceId, query.workspaceId)];

    if (query.actionType) {
      conditions.push(eq(activityEvents.actionType, query.actionType));
    }
    if (query.entityType) {
      conditions.push(eq(activityEvents.entityType, query.entityType));
    }
    if (query.actorUserId) {
      conditions.push(eq(activityEvents.actorUserId, query.actorUserId));
    }
    if (query.from) {
      conditions.push(gte(activityEvents.createdAt, query.from));
    }
    if (query.to) {
      conditions.push(lte(activityEvents.createdAt, query.to));
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityEvents)
      .where(and(...conditions));

    return count ?? 0;
  }

  async deleteOlderThan(cutoff: Date) {
    await db.delete(activityEvents).where(lte(activityEvents.createdAt, cutoff));
  }
}

export const activityRepository = new ActivityRepository();

