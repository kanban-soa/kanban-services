import { Request, Response } from "express";
import { activityService } from "@activity-service/services/activity.service";
import { sendError, sendSuccess } from "@activity-service/utils/response.util";
import { workspaceClient } from "@activity-service/infrastructure/workspace.client";
import type { AuthenticatedRequest } from "@activity-service/middleware/auth";

export class ActivityController {
  async createInternal(req: Request, res: Response) {
    try {
      const {
        workspaceId,
        actorUserId,
        actionType,
        entityType,
        entityId,
        metadata,
      } = req.body ?? {};

      if (!workspaceId || !actorUserId || !actionType || !entityType || !entityId) {
        return sendError(res, "Missing required fields", 400);
      }

      const event = await activityService.create({
        workspaceId: Number(workspaceId),
        actorUserId,
        actionType,
        entityType,
        entityId,
        metadata: metadata ?? null,
      });

      return sendSuccess(res, event, "Activity logged", 201);
    } catch (error) {
      return sendError(res, (error as Error).message, 500);
    }
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const workspaceId = Number(req.params.workspaceId);
      if (Number.isNaN(workspaceId)) {
        return sendError(res, "Invalid workspace ID", 400);
      }

      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, "Unauthorized", 401);
      }

      const { isAdmin, isOwner } = await workspaceClient.checkAdminOrOwner(workspaceId, userId);
      if (!isAdmin && !isOwner) {
        return sendError(res, "Forbidden", 403);
      }

      const page = Math.max(1, Number(req.query.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
      const offset = (page - 1) * limit;

      const { actionType, entityType, actorUserId, from, to } = req.query;

      const result = await activityService.list({
        workspaceId,
        actionType: actionType as string | undefined,
        entityType: entityType as string | undefined,
        actorUserId: actorUserId as string | undefined,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
        limit,
        offset,
      });

      console.log(`Activity response: ${JSON.stringify(result)}`)

      return sendSuccess(res, {
        items: result.items,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      return sendError(res, (error as Error).message, 500);
    }
  }
}

export const activityController = new ActivityController();

