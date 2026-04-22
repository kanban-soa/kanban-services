import { Request, Response } from "express";
import { permissionService } from "../services/permission.service";
import { workspaceService } from "../services/workspace.service";
import { memberRepository } from "../repositories/member.repo";
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendNotFound,
  sendForbidden,
} from "../utils/response.util";
import { logger } from "../utils/logger";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
} from "../config/constants";

/**
 * Permission Controller
 * Handles HTTP requests for role and permission operations
 */
export class PermissionController {
  /**
   * GET /workspaces/:id/permissions
   * Get user's permissions in workspace
   */
  async getPermissions(req: Request, res: Response) {
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

      // Check if user is member and resolve their memberId
      const member = await memberRepository.findByUserAndWorkspace(userId, workspaceId);
      if (!member) {
        return sendForbidden(res, ERROR_MESSAGES.PERMISSION_DENIED);
      }

      // Check permissions using the member's DB row ID
      const canEdit = await permissionService.memberHasPermission(
        member.id,
        "workspace.update"
      );
      const canDelete = await permissionService.memberHasPermission(
        member.id,
        "workspace.delete"
      );
      const canManageMembers = await permissionService.memberHasPermission(
        member.id,
        "member.invite"
      );

      return sendSuccess(
        res,
        {
          canEdit,
          canDelete,
          canManageMembers,
        },
        "Permissions retrieved successfully"
      );
    } catch (error) {
      logger.error("Error getting permissions", error);
      return sendError(res, (error as Error).message);
    }
  }

  /**
   * POST /workspaces/:id/permissions
   * Check specific permission
   */
  async checkPermission(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      // Support both POST body and GET query param for the permission string
      const permission = req.body?.permission || (req.query.permission as string);

      if (!userId) {
        return sendUnauthorized(res);
      }

      if (!permission || typeof permission !== "string") {
        return sendBadRequest(res, "Permission is required");
      }

      const workspaceId = parseInt(id, 10);
      if (isNaN(workspaceId)) {
        return sendBadRequest(res, "Invalid workspace ID");
      }

      // Resolve the member row first to get correct memberId
      const member = await memberRepository.findByUserAndWorkspace(userId, workspaceId);
      if (!member) {
        return sendForbidden(res, ERROR_MESSAGES.PERMISSION_DENIED);
      }

      const hasPermission = await permissionService.memberHasPermission(
        member.id,
        permission
      );

      return sendSuccess(res, { hasPermission });
    } catch (error) {
      logger.error("Error checking permission", error);
      return sendError(res, (error as Error).message);
    }
  }

  /**
   * GET /workspaces/:id/roles
   * Get all roles in workspace
   */
  async getRoles(req: Request, res: Response) {
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

      const roles = await permissionService.getWorkspaceRoles(workspaceId);
      return sendSuccess(res, roles);
    } catch (error) {
      logger.error("Error getting roles", error);
      return sendError(res, (error as Error).message);
    }
  }

  /**
   * POST /workspaces/:id/roles
   * Create new role
   */
  async createRole(req: Request, res: Response) {
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

      const { name, description, hierarchyLevel } = req.body;

      if (!name || typeof name !== "string") {
        return sendBadRequest(res, "Role name is required");
      }

      if (hierarchyLevel === undefined || typeof hierarchyLevel !== "number") {
        return sendBadRequest(res, "Hierarchy level is required");
      }

      const role = await permissionService.createRole({
        workspaceId,
        name,
        description,
        hierarchyLevel,
      });

      logger.info(`Role created by user ${userId}: ${name} in workspace ${workspaceId}`);
      return sendCreated(res, role, "Role created successfully");
    } catch (error) {
      logger.error("Error creating role", error);
      return sendError(res, (error as Error).message);
    }
  }

  /**
   * GET /workspaces/:id/roles/:roleId/permissions
   * Get role permissions
   */
  async getRolePermissions(req: Request, res: Response) {
    try {
      const { id, roleId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaceId = parseInt(id, 10);
      const roleIdNum = parseInt(roleId, 10);

      if (isNaN(workspaceId) || isNaN(roleIdNum)) {
        return sendBadRequest(res, "Invalid workspace or role ID");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspaceId, userId);
      if (!isAdmin) {
        return sendForbidden(res, ERROR_MESSAGES.PERMISSION_DENIED);
      }

      const permissions = await permissionService.getRolePermissions(roleIdNum);
      return sendSuccess(res, permissions);
    } catch (error) {
      logger.error("Error getting role permissions", error);
      return sendError(res, (error as Error).message);
    }
  }

  /**
   * POST /workspaces/:id/roles/:roleId/permissions
   * Grant permission to role
   */
  async grantPermission(req: Request, res: Response) {
    try {
      const { id, roleId } = req.params;
      const userId = req.user?.id;
      const { permission } = req.body;

      if (!userId) {
        return sendUnauthorized(res);
      }

      if (!permission || typeof permission !== "string") {
        return sendBadRequest(res, "Permission is required");
      }

      const workspaceId = parseInt(id, 10);
      const roleIdNum = parseInt(roleId, 10);

      if (isNaN(workspaceId) || isNaN(roleIdNum)) {
        return sendBadRequest(res, "Invalid workspace or role ID");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspaceId, userId);
      if (!isAdmin) {
        return sendForbidden(res, ERROR_MESSAGES.PERMISSION_DENIED);
      }

      const result = await permissionService.grantPermissionToRole(roleIdNum, permission);

      logger.info(
        `Permission granted by user ${userId}: ${permission} to role ${roleIdNum}`
      );
      return sendCreated(res, result, "Permission granted successfully");
    } catch (error) {
      const message = (error as Error).message;
      if (message === ERROR_MESSAGES.INVALID_PERMISSION) {
        return sendBadRequest(res, message);
      }
      logger.error("Error granting permission", error);
      return sendError(res, message);
    }
  }
}

/**
 * Helper function - should be in utils but included here for context
 */
function sendUnauthorized(res: Response) {
  return res.status(HTTP_STATUS.UNAUTHORIZED).json({
    success: false,
    statusCode: HTTP_STATUS.UNAUTHORIZED,
    message: "Unauthorized",
    error: "Authentication required",
    timestamp: new Date().toISOString(),
  });
}

export const permissionController = new PermissionController();
