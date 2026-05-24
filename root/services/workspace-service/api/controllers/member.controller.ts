import { Request, Response } from "express";
import { memberService } from "@workspace-service/services/member.service";
import { workspaceService } from "@workspace-service/services/workspace.service";
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNoContent,
  calculatePagination,
  sendPaginated,
  handleControllerError,
} from "@workspace-service/utils/response.util";
import { logger } from "@workspace-service/utils/logger";
import {
  ERROR_CODES,
  PAGINATION,
} from "@workspace-service/config/constants";

/**
 * Member Controller
 * Handles HTTP requests for workspace member operations
 */
export class MemberController {
  /**
   * POST /workspaces/:id/members
   * Invite a member to workspace
   */
  async inviteMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspace = await workspaceService.getWorkspaceByPublicId(String(id));
      if (!workspace) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Workspace not found");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspace.id, userId);
      if (!isAdmin) {
        return sendForbidden(res);
      }

      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Email is required");
      }

      const member = await memberService.inviteMember({
        email,
        workspaceId: workspace.publicId,
        invitedBy: userId,
      });

      logger.info(`Member invited by user ${userId}: ${email} to workspace ${workspace.publicId}`);
      return sendCreated(res, member, "Member invited successfully");
    } catch (error) {
      logger.error("Error inviting member", error);
      return handleControllerError(res, error);
    }
  }

  /**
   * GET /api/v1/workspaces/:id/members
   * Get all members in workspace
   */
  async getMembers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspace = await workspaceService.getWorkspaceByPublicId(String(id));
      if (!workspace) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Workspace not found");
      }

      // Check if user is member
      const isMember = await workspaceService.isMember(workspace.id, userId);
      if (!isMember) {
        return sendForbidden(res);
      }

      const page = Math.max(1, parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE);
      const limit = Math.min(
        PAGINATION.MAX_LIMIT,
        parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT
      );
      const offset = (page - 1) * limit;

      const members = await memberService.getWorkspaceActiveMembers(
        workspace.id,
        limit,
        offset
      );
      const total = await workspaceService.getMembersCount(workspace.id);
      const pagination = calculatePagination(total, page, limit);
      return sendPaginated(res, members, pagination);
    } catch (error) {
      logger.error("Error getting members", error);
      return handleControllerError(res, error);
    }
  }

  /**
   * PATCH /workspaces/:workspaceId/members/:memberId
   * Update member role
   */
  async updateMemberRole(req: Request, res: Response) {
    try {
      const { workspaceId, memberId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const memberUUId = memberId as string; // Keep as string for role update

      if (!workspaceId || !memberUUId) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Invalid workspace or member ID");
      }

      const workspace = await workspaceService.getWorkspaceByPublicId(String(workspaceId));
      if (!workspace) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Workspace not found");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspace.id, String(userId));
      if (!isAdmin) {
        return sendForbidden(res);
      }

      const { role } = req.body;
      if (!role) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Role is required");
      }

      const member = await memberService.updateMemberRole(memberUUId, { role });

      // logger.info(`Member role updated by user ${userId}: ${memberUUId} -> ${role}`);
      return sendSuccess(res, member, "Member role updated successfully");
    } catch (error) {
      logger.error("Error updating member role", error);
      return handleControllerError(res, error);
    }
  }

  /**
   * DELETE /api/v1/workspaces/:id/members/:memberId
   * Remove member from workspace
   */
  async removeMember(req: Request, res: Response) {
    try {
      const { id, memberId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaceId = id;
      const memberIdNum = parseInt(memberId as string, 10);

      if (!workspaceId || isNaN(memberIdNum)) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Invalid workspace or member ID");
      }

      const workspace = await workspaceService.getWorkspaceByPublicId(String(workspaceId));

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspace.id, userId);
      const member = await memberService.getMemberById(memberIdNum);
      const isSelf = userId === member.userId; // Allow users to remove themselves
      if (!isAdmin && !isSelf) {
        logger.warn(`Unauthorized member removal attempt by user ${userId} on member ${memberId} in workspace ${workspaceId}`);
        return sendForbidden(res, ERROR_CODES.PERMISSION_DENIED, "Only admins can remove members");
      }

      await memberService.removeMember(memberIdNum, userId);

      logger.info(`Member removed by user ${userId}: ${memberIdNum} from workspace ${workspaceId}`);
      return sendNoContent(res);
    } catch (error) {
      logger.error("Error removing member", error);
      return handleControllerError(res, error);
    }
  }

  /**
   * GET /api/v1/workspaces/:id/members/:memberId
   * Get member details
   */
  async getMember(req: Request, res: Response) {
    try {
      const { id, memberId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaceId = parseInt(id as string, 10);
      const memberIdNum = parseInt(memberId as string, 10);

      if (isNaN(workspaceId) || isNaN(memberIdNum)) {
        return sendBadRequest(res, ERROR_CODES.INVALID_INPUT, "Invalid workspace or member ID");
      }

      // Check if user is member of workspace
      const isMember = await workspaceService.isMember(workspaceId, userId);
      if (!isMember) {
        return sendForbidden(res);
      }

      const member = await memberService.getMemberById(memberIdNum);
      return sendSuccess(res, member);
    } catch (error) {
      logger.error("Error getting member", error);
      return handleControllerError(res, error);
    }
  }

  /**
   * POST /api/v1/workspaces/:id/members/summary
   * Return a compact list of member ids and emails for internal lookups
   */
  async getMemberSummaries(req: Request, res: Response) {
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

      const isMember = await workspaceService.isMember(workspaceId, userId);
      if (!isMember) {
        return sendForbidden(res);
      }

      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      const memberIds = ids
        .map((value: unknown) => Number(value))
        .filter((value: number) => Number.isFinite(value));

      if (memberIds.length === 0) {
        return sendSuccess(res, { members: [] }, "Member summaries");
      }

      const members = await memberService.getMemberSummaries(workspaceId, memberIds);

      return sendSuccess(res, { members }, "Member summaries");
    } catch (error) {
      logger.error("Error getting member summaries", error);
      return handleControllerError(res, error);
    }
  }

  /**
   * GET /api/workspaces/:id/members/invitation
   * Get all invited members in workspace
   */
  async getInvitedMembers(req: Request, res: Response) {
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

      // Only admins can view the invitation list
      const isAdmin = await workspaceService.isAdmin(workspaceId, userId);
      if (!isAdmin) {
        return sendForbidden(res);
      }

      const members = await memberService.getInvitedMembers(workspaceId);

      logger.info(`Invited members fetched for workspace ${workspaceId} by user ${userId}`);
      return sendSuccess(res, members, "Invited members retrieved successfully");
    } catch (error) {
      logger.error("Error getting invited members", error);
      return handleControllerError(res, error);
    }
  }

}

export const memberController = new MemberController();
