import { Request, Response } from "express";
import { workspaceService } from "@workspace-service/services/workspace.service";
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
      const { workspaceId, userId } = req.params;

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
   * POST /internal/workspaces/:workspaceId/members/bulk
   * Get multiple members by their public IDs
   */
  async getMembersBulk(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;
      const { publicIds } = req.body;

      const wsId = parseInt(workspaceId, 10);
      if (isNaN(wsId)) {
        return sendNotFound(res, ERROR_CODES.WORKSPACE_NOT_FOUND, "Workspace not found");
      }

      if (!publicIds || !Array.isArray(publicIds)) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST, "publicIds array is required");
      }

      const { memberService } = await import("@workspace-service/services/member.service");
      const members = await memberService.getMembersByPublicIds(wsId, publicIds);
      
      return sendSuccess(res, members, "Members retrieved");
    } catch (error) {
      logger.error("Error fetching members bulk", error);
      return handleControllerError(res, error);
    }
  }
}

export const internalController = new InternalController();
