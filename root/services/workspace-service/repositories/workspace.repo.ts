import { db } from "../lib/db";
import { workspaces } from "../schema/workspaces";
import { eq, ne, and, isNull, desc } from "drizzle-orm";
import { logger } from "../utils/logger";

export interface CreateWorkspaceInput {
  publicId: string;
  name: string;
  slug: string;
  description?: string;
  plan: string;
  createdBy: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  slug?: string;
  description?: string;
  plan?: string;
  updatedAt?: Date;
}

/**
 * Workspace Repository
 * Handles all database operations for workspaces
 */
export class WorkspaceRepository {
  /**
   * Create a new workspace
   */
  async create(input: CreateWorkspaceInput) {
    try {
      const result = await db.insert(workspaces).values(input).returning();
      logger.debug("Workspace created", { publicId: input.publicId });
      return result[0];
    } catch (error) {
      logger.error("Error creating workspace", error);
      throw error;
    }
  }

  /**
   * Get workspace by ID
   */
  async findById(id: number) {
    try {
      const result = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, id))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error("Error finding workspace by ID", error);
      throw error;
    }
  }

  /**
   * Get workspace by public ID
   */
  async findByPublicId(publicId: string) {
    try {
      const result = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.publicId, publicId))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error("Error finding workspace by public ID", error);
      throw error;
    }
  }

  /**
   * Get workspace by slug
   */
  async findBySlug(slug: string) {
    try {
      const result = await db
        .select()
        .from(workspaces)
        .where(
          and(
            eq(workspaces.slug, slug),
            isNull(workspaces.deletedAt)
          )
        )
        .limit(1);
      return result[0] || null;
    } catch (error) {
      logger.error("Error finding workspace by slug", error);
      throw error;
    }
  }

  /**
   * Get all active workspaces for a user
   */
  async findByCreator(userId: string) {
    try {
      const result = await db
        .select()
        .from(workspaces)
        .where(
          and(
            eq(workspaces.createdBy, userId),
            isNull(workspaces.deletedAt)
          )
        )
        .orderBy(desc(workspaces.createdAt));
      return result;
    } catch (error) {
      logger.error("Error finding workspaces by creator", error);
      throw error;
    }
  }

  /**
   * Get all active workspaces
   */
  async findAll(limit: number = 20, offset: number = 0) {
    try {
      const result = await db
        .select()
        .from(workspaces)
        .where(isNull(workspaces.deletedAt))
        .orderBy(desc(workspaces.createdAt))
        .limit(limit)
        .offset(offset);
      return result;
    } catch (error) {
      logger.error("Error finding all workspaces", error);
      throw error;
    }
  }

  /**
   * Count active workspaces
   */
  async count() {
    try {
      const result = await db
        .select()
        .from(workspaces)
        .where(isNull(workspaces.deletedAt));
      return result.length;
    } catch (error) {
      logger.error("Error counting workspaces", error);
      throw error;
    }
  }

  /**
   * Update workspace
   */
  async update(id: number, input: UpdateWorkspaceInput) {
    try {
      const result = await db
        .update(workspaces)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(workspaces.id, id))
        .returning();
      logger.debug("Workspace updated", { id });
      return result[0] || null;
    } catch (error) {
      logger.error("Error updating workspace", error);
      throw error;
    }
  }

  /**
   * Soft delete workspace
   */
  async softDelete(id: number, deletedBy: string) {
    try {
      const result = await db
        .update(workspaces)
        .set({
          deletedAt: new Date(),
          deletedBy,
        })
        .where(eq(workspaces.id, id))
        .returning();
      logger.debug("Workspace soft deleted", { id, deletedBy });
      return result[0] || null;
    } catch (error) {
      logger.error("Error soft deleting workspace", error);
      throw error;
    }
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    try {
      const conditions = excludeId
        ? and(
            eq(workspaces.slug, slug),
            isNull(workspaces.deletedAt),
            ne(workspaces.id, excludeId)
          )
        : and(
            eq(workspaces.slug, slug),
            isNull(workspaces.deletedAt)
          );

      const result = await db
        .select()
        .from(workspaces)
        .where(conditions)
        .limit(1);

      return result.length > 0;
    } catch (error) {
      logger.error("Error checking slug existence", error);
      throw error;
    }
  }
}

export const workspaceRepository = new WorkspaceRepository();
