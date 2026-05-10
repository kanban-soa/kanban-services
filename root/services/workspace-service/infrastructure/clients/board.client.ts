import { BaseClient } from "./base.client";
import config from "@workspace-service/config/env";
import { logger } from "@workspace-service/utils/logger";

/**
 * Board service response types
 */
export interface Board {
  id: string;
  publicId: string;
  title: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * BoardClient
 * Communicates with the board-service for board management.
 *
 * Endpoints:
 *   GET    /api/boards?workspaceId=    → getBoardsByWorkspace
 *   DELETE /api/boards?workspaceId=    → deleteBoardsByWorkspace
 *
 * NOTE: The board-service does not yet have workspace-scoped endpoints.
 * These methods will log warnings until those endpoints are implemented.
 * Coordinate with the board-service team to add the required routes.
 */
class BoardClient extends BaseClient {
  constructor() {
    super(config.services.boardUrl, "board-service");
  }

  /**
   * Get all boards belonging to a workspace
   */
  async getBoardsByWorkspace(workspaceId: string): Promise<Board[]> {
    return this.get<Board[]>("/api/boards", { params: { workspaceId } });
  }

  /**
   * Delete all boards belonging to a workspace
   * Used when a workspace is soft-deleted — cascading cleanup.
   * This is a non-critical operation: callers should catch and continue on failure.
   */
  async deleteBoardsByWorkspace(workspaceId: string, deletedBy: string): Promise<void> {
    await this.delete("/api/boards", {
      params: { workspaceId },
      headers: { "x-user-id": deletedBy },
    });
  }
}

export const boardClient = new BoardClient();
