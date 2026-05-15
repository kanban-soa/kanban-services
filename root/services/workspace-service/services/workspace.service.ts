import { workspaceRepository } from "../repositories/workspace.repo";
import { memberRepository } from "../repositories/member.repo";
import { permissionRepository } from "../repositories/permission.repo";
import { generatePublicId, generateSlug, generateUniqueSlug } from "../utils/id.util";
import { logger } from "../utils/logger";
import { MEMBER_ROLES, MEMBER_STATUS, ERROR_MESSAGES } from "../config/constants";

export interface CreateWorkspaceDTO {
  name: string;
  slug?: string;
  description?: string;
  createdBy: string;
}

/**
 * Workspace Service
 * Contains business logic for workspace operations
 */
export class WorkspaceService {
  /**
   * Create a new workspace
   * - Generate public ID and slug
   * - Create workspace
   * - Auto-add creator as admin
   */
  async createWorkspace(input: CreateWorkspaceDTO) {
    try {
      const publicId = generatePublicId();
      let slug = input.slug || generateSlug(input.name);

      // Check if slug exists
      let slugExists = await workspaceRepository.slugExists(slug);
      if (slugExists) {
        slug = generateUniqueSlug(slug);
      }

      // Create workspace
      const workspace = await workspaceRepository.create({
        publicId,
        name: input.name,
        slug,
        description: input.description,
        plan: "free",
        createdBy: input.createdBy,
      });

      logger.info(`Workspace created: ${workspace.name} (${publicId})`);

      // Auto-add creator as admin
      await this.addMemberAsAdmin(workspace.id, input.createdBy, input.createdBy);

      return workspace;
    } catch (error) {
      logger.error("Error creating workspace", error);
      throw error;
    }
  }

  /**
   * Get workspace by ID with validation
   */
  async getWorkspaceById(workspaceId: number) {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new Error(ERROR_MESSAGES.WORKSPACE_NOT_FOUND);
    }
    const members = await memberRepository.countByWorkspace(workspaceId);
    return { ...workspace, members };
  }

  /**
   * Get workspace by public ID
   */
  async getWorkspaceByPublicId(publicId: string) {
    const workspace = await workspaceRepository.findByPublicId(publicId);
    if (!workspace) {
      throw new Error(ERROR_MESSAGES.WORKSPACE_NOT_FOUND);
    }
    return workspace;
  }

  /**
   * Get all workspaces for a user
   */
  async getWorkspacesByUser(userId: string) {
    try {
      const workspaces = await memberRepository.findWorkspacesByUserId(userId);
      if (!workspaces || workspaces.length === 0) {
        return [];
      }

      // Get workspace details for each membership
      const resolvedWorkspaces = await Promise.all(
        workspaces.map(async (workspace) => {
          try {
            return await this.getWorkspaceById(workspace.id);
          } catch {
            return null;
          }
        })
      );

      return resolvedWorkspaces.filter((ws) => ws !== null);
    } catch (error) {
      logger.error("Error getting workspaces by user", error);
      throw error;
    }
  }

  /**
   * Update workspace details
   */
  async updateWorkspace(
    workspaceId: number,
    input: {
      name?: string;
      slug?: string;
      description?: string;
    }
  ) {
    try {
      // Validate slug uniqueness if slug is being updated
      if (input.slug) {
        const slugExists = await workspaceRepository.slugExists(input.slug, workspaceId);
        if (slugExists) {
          throw new Error(ERROR_MESSAGES.WORKSPACE_SLUG_EXISTS);
        }
      }

      const workspace = await workspaceRepository.update(workspaceId, input);
      logger.info(`Workspace updated: ${workspaceId}`);
      return workspace;
    } catch (error) {
      logger.error("Error updating workspace", error);
      throw error;
    }
  }

  /**
   * Delete workspace (soft delete)
   */
  async deleteWorkspace(workspaceId: number, deletedBy: string) {
    try {
      const workspace = await this.getWorkspaceById(workspaceId);
      
      const deleted = await workspaceRepository.softDelete(workspaceId, deletedBy);
      logger.info(`Workspace deleted: ${workspace.name} (${workspace.publicId})`);
      
      return deleted;
    } catch (error) {
      logger.error("Error deleting workspace", error);
      throw error;
    }
  }

  /**
   * Add member as admin to workspace
   * Used internally when creating workspace or inviting admin
   */
  private async addMemberAsAdmin(
    workspaceId: number,
    userId: string,
    createdBy: string
  ) {
    try {
      const publicId = generatePublicId();
      
      // Get or find user email (would need user service call)
      // For now, we'll use a placeholder
      const email = `user-${userId}@workspace.local`;

      await memberRepository.create({
        publicId,
        email,
        userId,
        workspaceId,
        createdBy,
        role: MEMBER_ROLES.ADMIN,
        status: MEMBER_STATUS.ACTIVE,
      });

      logger.debug(`Admin member added to workspace: ${workspaceId}`);
    } catch (error) {
      logger.error("Error adding admin member", error);
      throw error;
    }
  }

  /**
   * Check if user is member of workspace
   */
  async isMember(workspaceId: number, userId: string): Promise<boolean> {
    try {
      const member = await memberRepository.findByUserAndWorkspace(userId, workspaceId);
      return member !== null;
    } catch (error) {
      logger.error("Error checking membership", error);
      throw error;
    }
  }

  /**
   * Check if user is admin of workspace
   */
  async isAdmin(workspaceId: number, userId: string): Promise<boolean> {
    try {
      const member = await memberRepository.findByUserAndWorkspace(userId, workspaceId);
      return member !== null && member.role === MEMBER_ROLES.ADMIN;
    } catch (error) {
      logger.error("Error checking admin status", error);
      throw error;
    }
  }

  /**
   * Get workspace members count
   */
  async getMembersCount(workspaceId: number): Promise<number> {
    try {
      return await memberRepository.countByWorkspace(workspaceId);
    } catch (error) {
      logger.error("Error getting members count", error);
      throw error;
    }
  }
}

export const workspaceService = new WorkspaceService();
