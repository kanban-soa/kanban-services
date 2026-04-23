import { db } from "@workspace-service/lib/db";
import { workspaceMembers } from "@workspace-service/schema/members";
import { workspaceRoles } from "@workspace-service/schema/permissions";
import { eq, and, isNull, desc } from "drizzle-orm";
import { logger } from "@workspace-service/utils/logger";

export interface CreateMemberInput {
  publicId: string;
  email: string;
  userId?: string;
  workspaceId: number;
  createdBy: string;
  role: string;
  roleId?: number;
  status: string;
}

export interface UpdateMemberInput {
  email?: string;
  userId?: string;
  role?: string;
  roleId?: number;
  status?: string;
  updatedAt?: Date;
}

/**
 * Member Repository
 * Handles all database operations for workspace members
 */
export class MemberRepository {
  /**
   * Create a new member
   */
  async create(input: CreateMemberInput) {
    try {
      const result = await db
        .insert(workspaceMembers)
        .values(input)
        .returning();
      logger.debug("Member created", {
        publicId: input.publicId,
        workspaceId: input.workspaceId,
      });
      return result[0];
    } catch (error) {
      logger.error("Error creating member", error);
      throw error;
    }
  }

  /**
   * Get member by ID
   */
  async findById(id: number) {
    try {
      const result = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.id, id))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error("Error finding member by ID", error);
      throw error;
    }
  }

  /**
   * Get member by public ID
   */
  async findByPublicId(publicId: string) {
    try {
      const result = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.publicId, publicId))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error("Error finding member by public ID", error);
      throw error;
    }
  }

  /**
   * Get member by user ID and workspace ID
   */
  async findByUserAndWorkspace(userId: string, workspaceId: number) {
    try {
      const result = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.userId, userId),
            eq(workspaceMembers.workspaceId, workspaceId),
            isNull(workspaceMembers.deletedAt)
          )
        )
        .limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error("Error finding member by user and workspace", error);
      throw error;
    }
  }

  /**
   * Get all active members in a workspace
   */
  async findByWorkspace(workspaceId: number, limit: number = 20, offset: number = 0) {
    try {
      const result = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            isNull(workspaceMembers.deletedAt)
          )
        )
        .orderBy(desc(workspaceMembers.createdAt))
        .limit(limit)
        .offset(offset);
      return result;
    } catch (error) {
      logger.error("Error finding members by workspace", error);
      throw error;
    }
  }

  /**
   * Count active members in a workspace
   */
  async countByWorkspace(workspaceId: number): Promise<number> {
    try {
      const result = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            isNull(workspaceMembers.deletedAt)
          )
        );
      return result.length;
    } catch (error) {
      logger.error("Error counting members in workspace", error);
      throw error;
    }
  }

  /**
   * Get all workspaces for a user
   */
  async findWorkspacesByUserId(userId: string) {
    try {
      const result = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.userId, userId),
            isNull(workspaceMembers.deletedAt)
          )
        )
        .orderBy(desc(workspaceMembers.createdAt));
      return result;
    } catch (error) {
      logger.error("Error finding workspaces by user ID", error);
      throw error;
    }
  }

  /**
   * Update member
   */
  async update(id: number, input: UpdateMemberInput) {
    try {
      const result = await db
        .update(workspaceMembers)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(workspaceMembers.id, id))
        .returning();
      logger.debug("Member updated", { id });
      return result[0] || null;
    } catch (error) {
      logger.error("Error updating member", error);
      throw error;
    }
  }

  /**
   * Soft delete member
   */
  async softDelete(id: number, deletedBy: string) {
    try {
      const result = await db
        .update(workspaceMembers)
        .set({
          deletedAt: new Date(),
          deletedBy,
          status: "removed",
        })
        .where(eq(workspaceMembers.id, id))
        .returning();
      logger.debug("Member soft deleted", { id, deletedBy });
      return result[0] || null;
    } catch (error) {
      logger.error("Error soft deleting member", error);
      throw error;
    }
  }

  /**
   * Check if member exists with email in workspace
   */
  async memberExistsByEmail(
    email: string,
    workspaceId: number
  ): Promise<boolean> {
    try {
      const result = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.email, email),
            eq(workspaceMembers.workspaceId, workspaceId),
            isNull(workspaceMembers.deletedAt)
          )
        )
        .limit(1);
      return result.length > 0;
    } catch (error) {
      logger.error("Error checking member existence by email", error);
      throw error;
    }
  }

  /**
   * Get admin members of a workspace
   */
  async findAdminsByWorkspace(workspaceId: number) {
    try {
      const result = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.role, "admin"),
            isNull(workspaceMembers.deletedAt)
          )
        );
      return result;
    } catch (error) {
      logger.error("Error finding admin members", error);
      throw error;
    }
  }
}

export const memberRepository = new MemberRepository();
