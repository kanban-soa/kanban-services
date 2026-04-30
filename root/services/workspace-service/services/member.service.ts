import { memberRepository } from "../repositories/member.repo";
import { workspaceRepository } from "../repositories/workspace.repo";
import { generatePublicId } from "../utils/id.util";
import { logger } from "../utils/logger";
import { MEMBER_ROLES, MEMBER_STATUS, ERROR_MESSAGES } from "../config/constants";

export interface InviteMemberDTO {
  email: string;
  role?: string;
  workspaceId: number;
  invitedBy: string;
}

export interface UpdateMemberDTO {
  role?: string;
  status?: string;
}

/**
 * Member Service
 * Contains business logic for workspace member operations
 */
export class MemberService {
  /**
   * Invite member to workspace
   */
  async inviteMember(input: InviteMemberDTO) {
    try {
      // Validate workspace exists
      const workspace = await workspaceRepository.findById(input.workspaceId);
      if (!workspace) {
        throw new Error(ERROR_MESSAGES.WORKSPACE_NOT_FOUND);
      }

      // Check if member already exists
      const exists = await memberRepository.memberExistsByEmail(
        input.email,
        input.workspaceId
      );
      if (exists) {
        throw new Error(ERROR_MESSAGES.DUPLICATE_MEMBER);
      }

      const publicId = generatePublicId();
      const role = input.role || MEMBER_ROLES.MEMBER;

      const member = await memberRepository.create({
        publicId,
        email: input.email,
        workspaceId: input.workspaceId,
        createdBy: input.invitedBy,
        role,
        status: MEMBER_STATUS.INVITED,
      });

      logger.info(
        `Member invited to workspace: ${input.email} to workspace ${input.workspaceId}`
      );

      return member;
    } catch (error) {
      logger.error("Error inviting member", error);
      throw error;
    }
  }

  /**
   * Accept workspace invitation
   * Called when user accepts invitation via email
   */
  async acceptInvitation(memberId: number, userId: string) {
    try {
      const member = await memberRepository.findById(memberId);
      if (!member) {
        throw new Error(ERROR_MESSAGES.MEMBER_NOT_FOUND);
      }

      // Validate member is in "invited" status before accepting
      if (member.status !== MEMBER_STATUS.INVITED) {
        throw new Error(`Member is not in invited status. Current status: ${member.status}`);
      }

      const updated = await memberRepository.update(memberId, {
        userId,
        status: MEMBER_STATUS.ACTIVE,
      });

      logger.info(`Member invitation accepted: ${memberId}`);
      return updated;
    } catch (error) {
      logger.error("Error accepting invitation", error);
      throw error;
    }
  }

  /**
   * Get member by ID
   */
  async getMemberById(memberId: number) {
    try {
      const member = await memberRepository.findById(memberId);
      if (!member) {
        throw new Error(ERROR_MESSAGES.MEMBER_NOT_FOUND);
      }
      return member;
    } catch (error) {
      logger.error("Error getting member", error);
      throw error;
    }
  }

  /**
   * Get all members in workspace
   */
  async getWorkspaceMembers(workspaceId: number, limit: number = 20, offset: number = 0) {
    try {
      // Validate workspace exists
      await workspaceRepository.findById(workspaceId);

      return await memberRepository.findByWorkspace(workspaceId, limit, offset);
    } catch (error) {
      logger.error("Error getting workspace members", error);
      throw error;
    }
  }

  /**
   * Update member role in workspace
   */
  async updateMemberRole(memberId: number, newRole: string) {
    try {
      // Validate role
      const validRoles = Object.values(MEMBER_ROLES) as string[];
      if (!validRoles.includes(newRole)) {
        throw new Error(ERROR_MESSAGES.INVALID_ROLE);
      }

      const member = await memberRepository.findById(memberId);
      if (!member) {
        throw new Error(ERROR_MESSAGES.MEMBER_NOT_FOUND);
      }

      const updated = await memberRepository.update(memberId, {
        role: newRole,
      });

      logger.info(`Member role updated: ${memberId} -> ${newRole}`);
      return updated;
    } catch (error) {
      logger.error("Error updating member role", error);
      throw error;
    }
  }

  /**
   * Remove member from workspace (soft delete)
   */
  async removeMember(memberId: number, removedBy: string) {
    try {
      const member = await memberRepository.findById(memberId);
      if (!member) {
        throw new Error(ERROR_MESSAGES.MEMBER_NOT_FOUND);
      }

      // Prevent removing the only admin
      if (member.role === MEMBER_ROLES.ADMIN) {
        const admins = await memberRepository.findAdminsByWorkspace(member.workspaceId);
        if (admins.length === 1) {
          throw new Error("Cannot remove the only admin member");
        }
      }

      const removed = await memberRepository.softDelete(memberId, removedBy);
      logger.info(`Member removed from workspace: ${memberId}`);
      return removed;
    } catch (error) {
      logger.error("Error removing member", error);
      throw error;
    }
  }

  /**
   * Get member role in workspace
   */
  async getMemberRole(memberId: number): Promise<string> {
    try {
      const member = await memberRepository.findById(memberId);
      if (!member) {
        throw new Error(ERROR_MESSAGES.MEMBER_NOT_FOUND);
      }
      return member.role;
    } catch (error) {
      logger.error("Error getting member role", error);
      throw error;
    }
  }

  /**
   * Check if member has a specific role
   */
  async hasRole(memberId: number, role: string): Promise<boolean> {
    try {
      const member = await memberRepository.findById(memberId);
      return member !== null && member.role === role;
    } catch (error) {
      logger.error("Error checking member role", error);
      return false;
    }
  }

  /**
   * Handle user deletion from Auth Service
   * Soft delete all memberships for the user
   */
  async handleUserDeletion(userId: string) {
    try {
      const memberships = await memberRepository.findWorkspacesByUserId(userId);
      
      // Soft delete all memberships
      await Promise.all(
        memberships.map((member: { id: number }) =>
          memberRepository.softDelete(member.id, userId)
        )
      );

      logger.info(`User deletion handled: ${userId} - ${memberships.length} memberships removed`);
    } catch (error) {
      logger.error("Error handling user deletion", error);
      throw error;
    }
  }

  /**
   * Get a subset of members by id for internal summaries
   */
  async getMemberSummaries(workspaceId: number, memberIds: number[]) {
    const members = await memberRepository.findMembersByIds(workspaceId, memberIds);
    return members.map((member) => ({
      id: member.id,
      email: member.email,
      userId: member.userId ?? null,
    }));
  }
}

export const memberService = new MemberService();
