import { db } from "../lib/db";
import { workspaceRoles, workspaceRolePermissions, workspaceMemberPermissions } from "../schema/permissions";
import { eq, and, isNull } from "drizzle-orm";
import { logger } from "../utils/logger";

export interface CreateRoleInput {
  publicId: string;
  workspaceId: number;
  name: string;
  description?: string;
  hierarchyLevel: number;
  isSystem: boolean;
}

export interface CreateRolePermissionInput {
  workspaceRoleId: number;
  permission: string;
  granted: boolean;
}

export interface CreateMemberPermissionInput {
  workspaceMemberId: number;
  permission: string;
  granted: boolean;
}

/**
 * Permission Repository
 * Handles all database operations for roles and permissions
 */
export class PermissionRepository {
  /**
   * Create a new role
   */
  async createRole(input: CreateRoleInput) {
    try {
      const result = await db
        .insert(workspaceRoles)
        .values(input)
        .returning();
      logger.debug("Role created", {
        publicId: input.publicId,
        workspaceId: input.workspaceId,
      });
      return result[0];
    } catch (error) {
      logger.error("Error creating role", error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: number) {
    try {
      const result = await db
        .select()
        .from(workspaceRoles)
        .where(eq(workspaceRoles.id, id))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error("Error getting role by ID", error);
      throw error;
    }
  }

  /**
   * Get role by name in workspace
   */
  async getRoleByName(workspaceId: number, name: string) {
    try {
      const result = await db
        .select()
        .from(workspaceRoles)
        .where(
          and(
            eq(workspaceRoles.workspaceId, workspaceId),
            eq(workspaceRoles.name, name)
          )
        )
        .limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error("Error getting role by name", error);
      throw error;
    }
  }

  /**
   * Get all roles in a workspace
   */
  async getRolesByWorkspace(workspaceId: number) {
    try {
      const result = await db
        .select()
        .from(workspaceRoles)
        .where(eq(workspaceRoles.workspaceId, workspaceId));
      return result;
    } catch (error) {
      logger.error("Error getting roles by workspace", error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(
    id: number,
    data: Partial<CreateRoleInput>
  ) {
    try {
      const result = await db
        .update(workspaceRoles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(workspaceRoles.id, id))
        .returning();
      logger.debug("Role updated", { id });
      return result[0] || null;
    } catch (error) {
      logger.error("Error updating role", error);
      throw error;
    }
  }

  /**
   * Create role permission
   */
  async createRolePermission(input: CreateRolePermissionInput) {
    try {
      const result = await db
        .insert(workspaceRolePermissions)
        .values(input)
        .returning();
      logger.debug("Role permission created", {
        workspaceRoleId: input.workspaceRoleId,
        permission: input.permission,
      });
      return result[0];
    } catch (error) {
      logger.error("Error creating role permission", error);
      throw error;
    }
  }

  /**
   * Get permissions by role ID
   */
  async getRolePermissions(roleId: number) {
    try {
      const result = await db
        .select()
        .from(workspaceRolePermissions)
        .where(eq(workspaceRolePermissions.workspaceRoleId, roleId));
      return result;
    } catch (error) {
      logger.error("Error getting role permissions", error);
      throw error;
    }
  }

  /**
   * Check if role has permission
   */
  async roleHasPermission(
    roleId: number,
    permission: string
  ): Promise<boolean> {
    try {
      const result = await db
        .select()
        .from(workspaceRolePermissions)
        .where(
          and(
            eq(workspaceRolePermissions.workspaceRoleId, roleId),
            eq(workspaceRolePermissions.permission, permission),
            eq(workspaceRolePermissions.granted, true)
          )
        )
        .limit(1);
      return result.length > 0;
    } catch (error) {
      logger.error("Error checking role permission", error);
      throw error;
    }
  }

  /**
   * Update role permission
   */
  async updateRolePermission(id: number, granted: boolean) {
    try {
      const result = await db
        .update(workspaceRolePermissions)
        .set({ granted })
        .where(eq(workspaceRolePermissions.id, id))
        .returning();
      logger.debug("Role permission updated", { id, granted });
      return result[0] || null;
    } catch (error) {
      logger.error("Error updating role permission", error);
      throw error;
    }
  }

  /**
   * Delete role permission
   */
  async deleteRolePermission(id: number) {
    try {
      const result = await db
        .delete(workspaceRolePermissions)
        .where(eq(workspaceRolePermissions.id, id))
        .returning();
      logger.debug("Role permission deleted", { id });
      return result[0] || null;
    } catch (error) {
      logger.error("Error deleting role permission", error);
      throw error;
    }
  }

  /**
   * Create member permission
   */
  async createMemberPermission(input: CreateMemberPermissionInput) {
    try {
      const result = await db
        .insert(workspaceMemberPermissions)
        .values(input)
        .returning();
      logger.debug("Member permission created", {
        workspaceMemberId: input.workspaceMemberId,
        permission: input.permission,
      });
      return result[0];
    } catch (error) {
      logger.error("Error creating member permission", error);
      throw error;
    }
  }

  /**
   * Get member permissions
   */
  async getMemberPermissions(memberId: number) {
    try {
      const result = await db
        .select()
        .from(workspaceMemberPermissions)
        .where(eq(workspaceMemberPermissions.workspaceMemberId, memberId));
      return result;
    } catch (error) {
      logger.error("Error getting member permissions", error);
      throw error;
    }
  }

  /**
   * Update member permission
   */
  async updateMemberPermission(id: number, granted: boolean) {
    try {
      const result = await db
        .update(workspaceMemberPermissions)
        .set({ granted, updatedAt: new Date() })
        .where(eq(workspaceMemberPermissions.id, id))
        .returning();
      logger.debug("Member permission updated", { id, granted });
      return result[0] || null;
    } catch (error) {
      logger.error("Error updating member permission", error);
      throw error;
    }
  }

  /**
   * Delete member permission
   */
  async deleteMemberPermission(id: number) {
    try {
      const result = await db
        .delete(workspaceMemberPermissions)
        .where(eq(workspaceMemberPermissions.id, id))
        .returning();
      logger.debug("Member permission deleted", { id });
      return result[0] || null;
    } catch (error) {
      logger.error("Error deleting member permission", error);
      throw error;
    }
  }
}

export const permissionRepository = new PermissionRepository();
