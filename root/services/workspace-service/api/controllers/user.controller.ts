import { Request, Response } from "express";
// import { userService } from "@workspace-service/services/user.service";
import { memberRepository } from "@workspace-service/repositories/member.repo";
import { permissionService } from "@workspace-service/services/permission.service";
import { sendSuccess, sendBadRequest, sendUnauthorized, sendForbidden, handleControllerError } from "@workspace-service/utils/response.util";
import { logger } from "@workspace-service/utils/logger";
import { ERROR_CODES } from "@workspace-service/config/constants";

/**
 * User Controller
 * Handles HTTP requests for user operations
 */
export class UserController {
    /**
     * GET /api/v1/workspaces/:id/users
     * Get all users in workspace
     */
    async getUsers(req: Request, res: Response) {
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
}
