import { Request, Response } from "express";
import { userService } from "@workspace-service/services/user.service";
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendForbidden, sendUnauthorized } from "@workspace-service/utils/response.util";
import { logger } from "@workspace-service/utils/logger";
import { ERROR_MESSAGES, HTTP_STATUS } from "@workspace-service/config/constants";

/**
 * User Controller
 * Handles HTTP requests for user operations
 */
export class UserController {
    /**
     * GET /api/workspaces/:id/users
     * Get all users in workspace
     */
    async getUsers(req: Request, res: Response) {
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
}
