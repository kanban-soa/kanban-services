
// src/api/dto/board.dto.ts

/**
 * =========================================================
 * BOARD TYPES
 * =========================================================
 */

export type BoardVisibility = 'private' | 'public';

export type BoardType = 'regular' | 'template';

/**
 * =========================================================
 * CREATE BOARD DTO
 * =========================================================
 */

export interface CreateBoardDto {
  name: string;
  description?: string;
  visibility?: BoardVisibility;
  type?: BoardType;
}

/**
 * =========================================================
 * UPDATE BOARD DTO
 * =========================================================
 */

export interface UpdateBoardDto {
  name?: string;
  description?: string;
  visibility?: BoardVisibility;
  type?: BoardType;
}

/**
 * =========================================================
 * BOARD RESPONSE DTO
 * =========================================================
 */

export interface BoardResponseDto {
  id: number;
  publicId: string;
  name: string;
  description: string | null;
  slug: string;

  workspaceId: number;

  visibility: BoardVisibility;
  type: BoardType;

  createdBy: string | null;

  createdAt: Date;
  updatedAt: Date | null;
}

