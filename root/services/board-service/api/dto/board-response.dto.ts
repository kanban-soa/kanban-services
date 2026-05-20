// src/api/dto/board-response.dto.ts

/**
 * =========================================================
 * SHARED TYPES
 * =========================================================
 */

export type BoardVisibility = 'private' | 'public';

export type BoardType = 'regular' | 'template';

/**
 * =========================================================
 * LABEL DTO
 * =========================================================
 */

export interface LabelResponseDto {
  publicId: string;
  name: string;
  colourCode: string;
}
/**
 * =========================================================
 * CARD DTO
 * =========================================================
 */


export interface CardResponseDto {
  publicId: string;

  title: string;
  description: string | null;

  index: number;

  dueDate: Date | null;

  createdAt: Date;
  updatedAt: Date | null;

  labels: LabelResponseDto[];
}


/**
 * =========================================================
 * LIST DTO
 * =========================================================
 */

export interface ListResponseDto {
  publicId: string;

  name: string;

  index: number;

  createdAt: Date;
  updatedAt: Date | null;

  cards: CardResponseDto[];
}

/**
 * =========================================================
 * BOARD DETAIL RESPONSE DTO
 * =========================================================
 */

export interface BoardDetailResponseDto {
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

  lists: ListResponseDto[];
}


// src/api/dto/board.dto.ts

/**
 * =========================================================
 * BOARD TYPES
 * =========================================================
 */



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