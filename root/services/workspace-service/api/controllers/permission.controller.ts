import { Request, Response } from "express";
import { permissionService } from "@workspace-service/services/permission.service";
import { workspaceService } from "@workspace-service/services/workspace.service";
import { memberRepository } from "@workspace-service/repositories/member.repo";
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  handleControllerError,
} from "@workspace-service/utils/response.util";
import { logger } from "@workspace-service/utils/logger";
import { ERROR_CODES } from "@workspace-service/config/constants";

/**
 * Permission Controller
 * Handles HTTP requests for role and permission operations
 */
export class PermissionController {
  /**
   * GET /api/v1/workspaces/:id/permissions
   * Get user's permissions in workspace
   */
  async getPermissions(req: Request, res: Response) {
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

      // Check if user is member and resolve their memberId
      const member = await memberRepository.findByUserAndWorkspace(userId, workspaceId);
      if (!member) {
        return sendForbidden(res);
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
      return handleControllerError(res, error);
    }
  }

  /**
   * POST /api/v1/workspaces/:id/permissions
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
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Permission is required");
      }

      const workspaceId = parseInt(id as string, 10);
      if (isNaN(workspaceId)) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Invalid workspace ID");
      }

      // Resolve the member row first to get correct memberId
      const member = await memberRepository.findByUserAndWorkspace(userId, workspaceId);
      if (!member) {
        return sendForbidden(res);
      }

      const hasPermission = await permissionService.memberHasPermission(
        member.id,
        permission
      );

      return sendSuccess(res, { hasPermission });
    } catch (error) {
      logger.error("Error checking permission", error);
      return handleControllerError(res, error);
    }
  }

  /**
   * GET /api/v1/workspaces/:id/roles
   * Get all roles in workspace
   */
  async getRoles(req: Request, res: Response) {
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

      const roles = await permissionService.getWorkspaceRoles(workspaceId);
      return sendSuccess(res, roles);
    } catch (error) {
      logger.error("Error getting roles", error);
      return handleControllerError(res, error);
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

      const workspaceId = parseInt(id as string, 10);
      if (isNaN(workspaceId)) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Invalid workspace ID");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspaceId, userId);
      if (!isAdmin) {
        return sendForbidden(res);
      }

      const { name, description, hierarchyLevel } = req.body;

      if (!name || typeof name !== "string") {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Role name is required");
      }

      if (hierarchyLevel === undefined || typeof hierarchyLevel !== "number") {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Hierarchy level is required");
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
      return handleControllerError(res, error);
    }
  }

  /**
   * GET /api/v1/workspaces/:id/roles/:roleId/permissions
   * Get role permissions
   */
  async getRolePermissions(req: Request, res: Response) {
    try {
      const { id, roleId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaceId = parseInt(id as string, 10);
      const roleIdNum = parseInt(roleId as string, 10);

      if (isNaN(workspaceId) || isNaN(roleIdNum)) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Invalid workspace or role ID");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspaceId, userId);
      if (!isAdmin) {
        return sendForbidden(res);
      }

      const permissions = await permissionService.getRolePermissions(roleIdNum);
      return sendSuccess(res, permissions);
    } catch (error) {
      logger.error("Error getting role permissions", error);
      return handleControllerError(res, error);
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
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Permission is required");
      }

      const workspaceId = parseInt(id as string, 10);
      const roleIdNum = parseInt(roleId as string, 10);

      if (isNaN(workspaceId) || isNaN(roleIdNum)) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Invalid workspace or role ID");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspaceId, userId);
      if (!isAdmin) {
        return sendForbidden(res);
      }

      const result = await permissionService.grantPermissionToRole(roleIdNum, permission);

      logger.info(
        `Permission granted by user ${userId}: ${permission} to role ${roleIdNum}`
      );
      return sendCreated(res, result, "Permission granted successfully");
    } catch (error) {
      logger.error("Error granting permission", error);
      return handleControllerError(res, error);
    }
  }
}

export const permissionController = new PermissionController();
