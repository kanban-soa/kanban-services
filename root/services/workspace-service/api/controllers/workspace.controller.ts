import { Request, Response } from "express";
import { workspaceService } from "@workspace-service/services/workspace.service";
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendNotFound,
  sendForbidden,
  sendUnauthorized,
} from "@workspace-service/utils/response.util";
import { logger } from "@workspace-service/utils/logger";
import { ERROR_MESSAGES, HTTP_STATUS } from "@workspace-service/config/constants";

/**
 * Workspace Controller
 * Handles HTTP requests for workspace operations
 */
export class WorkspaceController {
  /**
   * POST /workspaces
   * Create a new workspace
   */
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendUnauthorized(res);
      }

      const { name, slug, description } = req.body;

      if (!name || typeof name !== "string") {
        return sendBadRequest(res, "Workspace name is required");
      }

      const workspace = await workspaceService.createWorkspace({
        name,
        slug,
        description,
        createdBy: userId,
      });

      logger.info(`Workspace created by user ${userId}: ${workspace.publicId}`);
      return sendCreated(res, workspace, "Workspace created successfully");
    } catch (error) {
      logger.error("Error creating workspace", error);
      return sendError(res, (error as Error).message);
    }
  }

  /**
   * GET /workspaces/:id
   * Get workspace by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Require authentication before accessing workspace details
      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaceId = parseInt(id, 10);
      if (isNaN(workspaceId)) {
        return sendBadRequest(res, "Invalid workspace ID");
      }

      const workspace = await workspaceService.getWorkspaceById(workspaceId);

      // Check if user is member
      const isMember = await workspaceService.isMember(workspaceId, userId);
      if (!isMember) {
        return sendForbidden(res, ERROR_MESSAGES.PERMISSION_DENIED);
      }

      return sendSuccess(res, workspace);
    } catch (error) {
      const message = (error as Error).message;
      if (message === ERROR_MESSAGES.WORKSPACE_NOT_FOUND) {
        return sendNotFound(res, message);
      }
      logger.error("Error getting workspace", error);
      return sendError(res, message);
    }
  }

  /**
   * GET /workspaces
   * Get all workspaces for authenticated user
   */
  async getAll(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaces = await workspaceService.getWorkspacesByUser(userId);
      return sendSuccess(res, workspaces);
    } catch (error) {
      logger.error("Error getting workspaces", error);
      return sendError(res, (error as Error).message);
    }
  }

  /**
   * PATCH /workspaces/:id
   * Update workspace
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaceId = parseInt(id, 10);
      if (isNaN(workspaceId)) {
        return sendBadRequest(res, "Invalid workspace ID");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspaceId, userId);
      if (!isAdmin) {
        return sendForbidden(res, ERROR_MESSAGES.PERMISSION_DENIED);
      }

      const { name, slug, description } = req.body;
      const workspace = await workspaceService.updateWorkspace(workspaceId, {
        name,
        slug,
        description,
      });

      logger.info(`Workspace updated by user ${userId}: ${workspaceId}`);
      return sendSuccess(res, workspace, "Workspace updated successfully");
    } catch (error) {
      const message = (error as Error).message;
      if (message === ERROR_MESSAGES.WORKSPACE_NOT_FOUND) {
        return sendNotFound(res, message);
      }
      if (message === ERROR_MESSAGES.WORKSPACE_SLUG_EXISTS) {
        return sendBadRequest(res, message);
      }
      logger.error("Error updating workspace", error);
      return sendError(res, message);
    }
  }

  /**
   * DELETE /workspaces/:id
   * Delete workspace (soft delete)
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaceId = parseInt(id, 10);
      if (isNaN(workspaceId)) {
        return sendBadRequest(res, "Invalid workspace ID");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspaceId, userId);
      if (!isAdmin) {
        return sendForbidden(res, ERROR_MESSAGES.PERMISSION_DENIED);
      }

      await workspaceService.deleteWorkspace(workspaceId, userId);

      logger.info(`Workspace deleted by user ${userId}: ${workspaceId}`);
      return res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      const message = (error as Error).message;
      if (message === ERROR_MESSAGES.WORKSPACE_NOT_FOUND) {
        return sendNotFound(res, message);
      }
      logger.error("Error deleting workspace", error);
      return sendError(res, message);
    }
  }
}

export const workspaceController = new WorkspaceController();
