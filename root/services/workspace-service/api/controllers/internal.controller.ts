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
}

export const internalController = new InternalController();
