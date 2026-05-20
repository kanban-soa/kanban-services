import { nanoid } from "nanoid";
import { activityRepository } from "@activity-service/repositories/activity.repo";
import config from "@activity-service/config/env";

export interface CreateActivityPayload {
  workspaceId: number;
  actorUserId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
}

export interface ActivityListQuery {
  workspaceId: number;
  actionType?: string;
  entityType?: string;
  actorUserId?: string;
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
}

export class ActivityService {
  async create(payload: CreateActivityPayload) {
    const event = await activityRepository.create({
      ...payload,
      publicId: nanoid(12),
    });

    const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - retentionMs);
    await activityRepository.deleteOlderThan(cutoff);

    return event;
  }

  async list(query: ActivityListQuery) {
    const [items, total] = await Promise.all([
      activityRepository.list(query),
      activityRepository.count({
        workspaceId: query.workspaceId,
        actionType: query.actionType,
        entityType: query.entityType,
        actorUserId: query.actorUserId,
        from: query.from,
        to: query.to,
      }),
    ]);

    return { items, total };
  }
}

export const activityService = new ActivityService();

