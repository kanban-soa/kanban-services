import { Request, Response } from "express";
import { workspaceService } from "@workspace-service/services/workspace.service";
import { memberService } from "@workspace-service/services/member.service";
import {
  sendSuccess,
  sendNotFound,
  sendError,
  handleControllerError,
} from "@workspace-service/utils/response.util";
import { ERROR_CODES, HTTP_STATUS } from "@workspace-service/config/constants";
import { logger } from "@workspace-service/utils/logger";

/**
 * Internal Controller
 * Handles internal service-to-service requests (no user auth required)
 */
export class InternalController {
  /**
   * GET /internal/workspaces/:workspaceId/members/:userId/authorization
   * Verify if the user is an admin or owner for the workspace
   */
  async getAuthorization(req: Request, res: Response) {
    try {
      const {workspaceId, userId} = req.params;

      const wsId = parseInt(workspaceId, 10);
      if (isNaN(wsId)) {
        return sendNotFound(res, ERROR_CODES.WORKSPACE_NOT_FOUND, "Workspace not found");
      }

      const result = await workspaceService.getAuthorization(wsId, userId);
      return sendSuccess(res, result, "Authorization verified");
    } catch (error) {
      logger.error("Error verifying workspace authorization", error);
      return handleControllerError(res, error);
    }
  }

  /**
   * GET /internal/workspaces/:id/members/me
   * Return the current user's member profile within a workspace
   */
  async getMemberMe(req: Request, res: Response) {
    try {
      const {id, userId} = req.params;
      console.log(`Member info for user ${userId} in workspace`)
      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaceId = parseInt(id as string, 10);
      if (isNaN(workspaceId)) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Invalid workspace ID");
      }

      const member = await memberService.getMemberByUserAndWorkspace(userId, workspaceId);

      if (!member) {
        return sendForbidden(res);
      }

      return sendSuccess(
          res,
          {
            member: {
              id: member.id,
              publicId: member.publicId,
              userId: member.userId ?? null,
              email: member.email,
            },
          },
          "Member profile",
      );
    } catch (error) {
      logger.error("Error getting member profile", error);
      return handleControllerError(res, error);
    }
  }

  /**
   * GET /internal/workspaces/by-public-id/:publicId
   * Resolve a workspace public ID to its internal numeric ID
   */
  async getByPublicId(req: Request, res: Response) {
    try {
      const { publicId } = req.params;
      if (!publicId) {
        return sendNotFound(res, ERROR_CODES.WORKSPACE_NOT_FOUND, "Workspace not found");
      }

      const workspace = await workspaceService.getWorkspaceByPublicId(publicId);
      if (!workspace) {
        return sendNotFound(res, ERROR_CODES.WORKSPACE_NOT_FOUND, "Workspace not found");
      }

      return sendSuccess(
        res,
        { id: workspace.id, publicId: workspace.publicId, name: workspace.name },
        "Workspace found",
      );
    } catch (error) {
      logger.error("Error resolving workspace by public ID", error);
      return handleControllerError(res, error);
    }
  }
}

export const internalController = new InternalController();
