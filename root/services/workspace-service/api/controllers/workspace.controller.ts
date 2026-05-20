import { Request, Response } from "express";
import { workspaceService } from "@workspace-service/services/workspace.service";
import { permissionService } from "@workspace-service/services/permission.service";
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  handleControllerError,
} from "@workspace-service/utils/response.util";
import { logger } from "@workspace-service/utils/logger";
import { ERROR_CODES, HTTP_STATUS } from "@workspace-service/config/constants";
import { boardClient } from "@workspace-service/infrastructure/clients";

/**
 * Workspace Controller
 * Handles HTTP requests for workspace operations
 */
export class WorkspaceController {
  /**
   * POST /api/v1/workspaces
   * Create a new workspace
   */
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      console.log("req.user", req.user);
      if (!userId) {
        return sendUnauthorized(res);
      }

      const { name, slug, description } = req.body;

      if (!name || typeof name !== "string") {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Workspace name is required");
      }

      const workspace = await workspaceService.createWorkspace({
        name,
        slug,
        description,
        createdBy: userId,
      });

      // Create role for workspace
      const role = await permissionService.createRole({
        workspaceId: workspace.id,
        name: "Admin",
        description: "Admin role",
        hierarchyLevel: 1,
        isSystem: true,
      });

      logger.info(`Workspace created by user ${userId}: ${workspace.publicId}`);
      return sendCreated(res, workspace, "Workspace created successfully");
    } catch (error) {
      logger.error("Error creating workspace", error);
      return handleControllerError(res, error);
    }
  }

  /**
   * GET /api/v1/workspaces/:id
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

      const workspaceId = parseInt(id as string, 10);
      if (isNaN(workspaceId)) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Invalid workspace ID");
      }

      const workspace = await workspaceService.getWorkspaceById(workspaceId);

      // Check if user is member
      const isMember = await workspaceService.isMember(workspaceId, userId);
      if (!isMember) {
        return sendForbidden(res);
      }

      return sendSuccess(res, workspace);
    } catch (error) {
      logger.error("Error getting workspace", error);
      return handleControllerError(res, error);
    }
  }

  /**
   * GET /workspaces
   * Get all workspaces for authenticated user
   */
  async getAll(req: Request, res: Response) {
    try {
      console.log("req.user", req.user);
      const userId = req.user?.id;
      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaces = await workspaceService.getWorkspacesByUser(userId);
      return sendSuccess(res, workspaces);
    } catch (error) {
      logger.error("Error getting workspaces", error);
      return handleControllerError(res, error);
    }
  }

  /**
   * PATCH /api/v1/workspaces/:id
   * Update workspace
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaceId = parseInt(id as string, 10);
      if (isNaN(workspaceId)) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Invalid workspace ID");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspaceId, userId);
      if (!isAdmin) {
        return sendForbidden(res);
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
      logger.error("Error updating workspace", error);
      return handleControllerError(res, error);
    }
  }

  /**
   * DELETE /api/v1/workspaces/:id
   * Delete workspace (soft delete)
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaceId = parseInt(id as string, 10);
      if (isNaN(workspaceId)) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Invalid workspace ID");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspaceId, userId);
      if (!isAdmin) {
        return sendForbidden(res);
      }

      await workspaceService.deleteWorkspace(workspaceId, userId);

      await boardClient.deleteBoardsByWorkspace(id as string, userId);

      logger.info(`Workspace deleted by user ${userId}: ${workspaceId}`);
      return res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      logger.error("Error deleting workspace", error);
      return handleControllerError(res, error);
    }
  }
}

export const workspaceController = new WorkspaceController();
