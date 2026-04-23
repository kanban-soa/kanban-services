import { Request, Response } from "express";
import { memberService } from "@workspace-service/services/member.service";
import { workspaceService } from "@workspace-service/services/workspace.service";
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendNotFound,
  sendForbidden,
  sendNoContent,
  sendUnauthorized,
  calculatePagination,
  sendPaginated,
} from "../../utils/response.util";
import { logger } from "../../utils/logger";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  PAGINATION,
} from "../../config/constants";

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

      const workspaceId = parseInt(id, 10);
      if (isNaN(workspaceId)) {
        return sendBadRequest(res, "Invalid workspace ID");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspaceId, userId);
      if (!isAdmin) {
        return sendForbidden(res, ERROR_MESSAGES.PERMISSION_DENIED);
      }

      const { email, role } = req.body;
      if (!email || typeof email !== "string") {
        return sendBadRequest(res, "Email is required");
      }

      const member = await memberService.inviteMember({
        email,
        role,
        workspaceId,
        invitedBy: userId,
      });

      logger.info(`Member invited by user ${userId}: ${email} to workspace ${workspaceId}`);
      return sendCreated(res, member, "Member invited successfully");
    } catch (error) {
      const message = (error as Error).message;
      if (message === ERROR_MESSAGES.DUPLICATE_MEMBER) {
        return sendBadRequest(res, message);
      }
      if (message === ERROR_MESSAGES.WORKSPACE_NOT_FOUND) {
        return sendNotFound(res, message);
      }
      logger.error("Error inviting member", error);
      return sendError(res, message);
    }
  }

  /**
   * GET /workspaces/:id/members
   * Get all members in workspace
   */
  async getMembers(req: Request, res: Response) {
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

      // Check if user is member
      const isMember = await workspaceService.isMember(workspaceId, userId);
      if (!isMember) {
        return sendForbidden(res, ERROR_MESSAGES.PERMISSION_DENIED);
      }

      const page = Math.max(1, parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE);
      const limit = Math.min(
        PAGINATION.MAX_LIMIT,
        parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT
      );
      const offset = (page - 1) * limit;

      const members = await memberService.getWorkspaceMembers(
        workspaceId,
        limit,
        offset
      );
      const total = await workspaceService.getMembersCount(workspaceId);

      const pagination = calculatePagination(total, page, limit);
      return sendPaginated(res, members, pagination);
    } catch (error) {
      const message = (error as Error).message;
      if (message === ERROR_MESSAGES.WORKSPACE_NOT_FOUND) {
        return sendNotFound(res, message);
      }
      logger.error("Error getting members", error);
      return sendError(res, message);
    }
  }

  /**
   * PATCH /workspaces/:id/members/:memberId
   * Update member role
   */
  async updateMemberRole(req: Request, res: Response) {
    try {
      const { id, memberId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaceId = parseInt(id, 10);
      const memberIdNum = parseInt(memberId, 10);

      if (isNaN(workspaceId) || isNaN(memberIdNum)) {
        return sendBadRequest(res, "Invalid workspace or member ID");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspaceId, userId);
      if (!isAdmin) {
        return sendForbidden(res, ERROR_MESSAGES.PERMISSION_DENIED);
      }

      const { role } = req.body;
      if (!role || typeof role !== "string") {
        return sendBadRequest(res, "Role is required");
      }

      const member = await memberService.updateMemberRole(memberIdNum, role);

      logger.info(`Member role updated by user ${userId}: ${memberIdNum} -> ${role}`);
      return sendSuccess(res, member, "Member role updated successfully");
    } catch (error) {
      const message = (error as Error).message;
      if (message === ERROR_MESSAGES.MEMBER_NOT_FOUND) {
        return sendNotFound(res, message);
      }
      if (message === ERROR_MESSAGES.INVALID_ROLE) {
        return sendBadRequest(res, message);
      }
      logger.error("Error updating member role", error);
      return sendError(res, message);
    }
  }

  /**
   * DELETE /workspaces/:id/members/:memberId
   * Remove member from workspace
   */
  async removeMember(req: Request, res: Response) {
    try {
      const { id, memberId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaceId = parseInt(id, 10);
      const memberIdNum = parseInt(memberId, 10);

      if (isNaN(workspaceId) || isNaN(memberIdNum)) {
        return sendBadRequest(res, "Invalid workspace or member ID");
      }

      // Check if user is admin
      const isAdmin = await workspaceService.isAdmin(workspaceId, userId);
      if (!isAdmin) {
        return sendForbidden(res, ERROR_MESSAGES.PERMISSION_DENIED);
      }

      await memberService.removeMember(memberIdNum, userId);

      logger.info(`Member removed by user ${userId}: ${memberIdNum} from workspace ${workspaceId}`);
      return sendNoContent(res);
    } catch (error) {
      const message = (error as Error).message;
      if (message === ERROR_MESSAGES.MEMBER_NOT_FOUND) {
        return sendNotFound(res, message);
      }
      logger.error("Error removing member", error);
      return sendError(res, message);
    }
  }

  /**
   * GET /workspaces/:id/members/:memberId
   * Get member details
   */
  async getMember(req: Request, res: Response) {
    try {
      const { id, memberId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return sendUnauthorized(res);
      }

      const workspaceId = parseInt(id, 10);
      const memberIdNum = parseInt(memberId, 10);

      if (isNaN(workspaceId) || isNaN(memberIdNum)) {
        return sendBadRequest(res, "Invalid workspace or member ID");
      }

      // Check if user is member of workspace
      const isMember = await workspaceService.isMember(workspaceId, userId);
      if (!isMember) {
        return sendForbidden(res, ERROR_MESSAGES.PERMISSION_DENIED);
      }

      const member = await memberService.getMemberById(memberIdNum);
      return sendSuccess(res, member);
    } catch (error) {
      const message = (error as Error).message;
      if (message === ERROR_MESSAGES.MEMBER_NOT_FOUND) {
        return sendNotFound(res, message);
      }
      logger.error("Error getting member", error);
      return sendError(res, message);
    }
  }
}

export const memberController = new MemberController();
