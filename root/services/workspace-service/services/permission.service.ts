import { permissionRepository } from "../repositories/permission.repo";
import { memberRepository } from "../repositories/member.repo";
import { generatePublicId } from "../utils/id.util";
import { logger } from "../utils/logger";
import { ROLE_PERMISSIONS, PERMISSION_TYPES, ERROR_MESSAGES } from "../config/constants";

export interface CreateRoleDTO {
  workspaceId: number;
  name: string;
  description?: string;
  hierarchyLevel: number;
  isSystem?: boolean;
}

/**
 * Permission Service
 * Contains business logic for role and permission operations
 */
export class PermissionService {
  /**
   * Create a new role
   */
  async createRole(input: CreateRoleDTO) {
    try {
      // Check if role already exists
      const existing = await permissionRepository.getRoleByName(
        input.workspaceId,
        input.name
      );
      if (existing) {
        throw new Error(`Role ${input.name} already exists in workspace`);
      }

      const publicId = generatePublicId();

      const role = await permissionRepository.createRole({
        publicId,
        workspaceId: input.workspaceId,
        name: input.name,
        description: input.description,
        hierarchyLevel: input.hierarchyLevel,
        isSystem: input.isSystem || false,
      });

      logger.info(`Role created: ${input.name} in workspace ${input.workspaceId}`);
      return role;
    } catch (error) {
      logger.error("Error creating role", error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRole(roleId: number) {
    try {
      const role = await permissionRepository.getRoleById(roleId);
      if (!role) {
        throw new Error("Role not found");
      }
      return role;
    } catch (error) {
      logger.error("Error getting role", error);
      throw error;
    }
  }

  /**
   * Get all roles in a workspace
   */
  async getWorkspaceRoles(workspaceId: number) {
    try {
      return await permissionRepository.getRolesByWorkspace(workspaceId);
    } catch (error) {
      logger.error("Error getting workspace roles", error);
      throw error;
    }
  }

  /**
   * Grant permission to role
   */
  async grantPermissionToRole(roleId: number, permission: string) {
    try {
      // Validate permission against the canonical PERMISSION_TYPES list
      const validPermissions = Object.values(PERMISSION_TYPES) as string[];
      if (!validPermissions.includes(permission)) {
        throw new Error(ERROR_MESSAGES.INVALID_PERMISSION);
      }

      const result = await permissionRepository.createRolePermission({
        workspaceRoleId: roleId,
        permission,
        granted: true,
      });

      logger.info(`Permission granted to role: ${roleId} -> ${permission}`);
      return result;
    } catch (error) {
      logger.error("Error granting permission", error);
      throw error;
    }
  }

  /**
   * Revoke permission from role
   */
  async revokePermissionFromRole(roleId: number, permission: string) {
    try {
      const permissions = await permissionRepository.getRolePermissions(roleId);
      const perm = permissions.find((p: { permission: string; id: number }) => p.permission === permission);

      if (perm) {
        await permissionRepository.updateRolePermission(perm.id, false);
        logger.info(`Permission revoked from role: ${roleId} -> ${permission}`);
      }

      return perm || null;
    } catch (error) {
      logger.error("Error revoking permission", error);
      throw error;
    }
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: number) {
    try {
      return await permissionRepository.getRolePermissions(roleId);
    } catch (error) {
      logger.error("Error getting role permissions", error);
      throw error;
    }
  }

  /**
   * Check if role has permission
   */
  async roleHasPermission(roleId: number, permission: string): Promise<boolean> {
    try {
      return await permissionRepository.roleHasPermission(roleId, permission);
    } catch (error) {
      logger.error("Error checking role permission", error);
      return false;
    }
  }

  /**
   * Check if member has permission
   */
  async memberHasPermission(
    memberId: number,
    permission: string
  ): Promise<boolean> {
    try {
      const member = await memberRepository.findById(memberId);
      if (!member) {
        return false;
      }

      // Check role permissions
      if (member.roleId) {
        const hasPermission = await this.roleHasPermission(member.roleId, permission);
        if (hasPermission) {
          return true;
        }
      }

      // Check member-specific permissions
      const memberPermissions = await permissionRepository.getMemberPermissions(memberId);
      return memberPermissions.some(
        (p: { permission: string; granted: boolean | null }) => p.permission === permission && p.granted
      );
    } catch (error) {
      logger.error("Error checking member permission", error);
      return false;
    }
  }

  /**
   * Grant permission to member
   */
  async grantPermissionToMember(memberId: number, permission: string) {
    try {
      const result = await permissionRepository.createMemberPermission({
        workspaceMemberId: memberId,
        permission,
        granted: true,
      });

      logger.info(`Permission granted to member: ${memberId} -> ${permission}`);
      return result;
    } catch (error) {
      logger.error("Error granting member permission", error);
      throw error;
    }
  }

  /**
   * Revoke permission from member
   */
  async revokePermissionFromMember(memberId: number, permission: string) {
    try {
      const permissions = await permissionRepository.getMemberPermissions(memberId);
      const perm = permissions.find((p: { permission: string; id: number }) => p.permission === permission);

      if (perm) {
        await permissionRepository.updateMemberPermission(perm.id, false);
        logger.info(`Permission revoked from member: ${memberId} -> ${permission}`);
      }

      return perm || null;
    } catch (error) {
      logger.error("Error revoking member permission", error);
      throw error;
    }
  }

  /**
   * Initialize default permissions for a role
   * Called when creating a new role or setting up defaults
   */
  async initializeDefaultPermissions(roleId: number, roleName: string) {
    try {
      // Map role name to default permissions
      const roleToPermissions: Record<string, string[]> = {
        admin: ROLE_PERMISSIONS.admin,
        member: ROLE_PERMISSIONS.member,
        guest: ROLE_PERMISSIONS.guest,
      };

      const defaultPermissions = roleToPermissions[roleName.toLowerCase()] || [];

      // Grant all default permissions
      await Promise.all(
        defaultPermissions.map((permission) =>
          this.grantPermissionToRole(roleId, permission)
        )
      );

      logger.debug(`Default permissions initialized for role: ${roleName}`);
    } catch (error) {
      logger.error("Error initializing default permissions", error);
      throw error;
    }
  }
}

export const permissionService = new PermissionService();
