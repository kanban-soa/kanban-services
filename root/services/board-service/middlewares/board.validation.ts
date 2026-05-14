
// src/shared/utils/board.validation.ts

import {
  BoardType,
  BoardVisibility,
  CreateBoardDto,
  UpdateBoardDto,
} from '@/board-service/api/dto/board.dto';

import { ApiError, ERROR_CODES } from '../shared/errors';

/**
 * =========================================================
 * VALID ENUMS
 * =========================================================
 */

const VALID_VISIBILITIES: BoardVisibility[] = [
  'private',
  'public',
];

const VALID_BOARD_TYPES: BoardType[] = [
  'regular',
  'template',
];

/**
 * =========================================================
 * CREATE BOARD VALIDATION
 * =========================================================
 */

export function validateCreateBoardPayload(
  payload: CreateBoardDto,
): void {
  /**
   * NAME
   */

  if (!payload.name) {
    throw new ApiError(
      400,
      ERROR_CODES.BAD_REQUEST,
      'Board name is required',
    );
  }

  if (typeof payload.name !== 'string') {
    throw new ApiError(
      400,
      ERROR_CODES.BAD_REQUEST,
      'Board name must be a string',
    );
  }

  if (!payload.name.trim()) {
    throw new ApiError(
      400,
      ERROR_CODES.BAD_REQUEST,
      'Board name cannot be empty',
    );
  }

  if (payload.name.trim().length > 255) {
    throw new ApiError(
      400,
      ERROR_CODES.BAD_REQUEST,
      'Board name must not exceed 255 characters',
    );
  }

  /**
   * DESCRIPTION
   */

  if (
    payload.description !== undefined &&
    typeof payload.description !== 'string'
  ) {
    throw new ApiError(
      400,
      ERROR_CODES.BAD_REQUEST,
      'Description must be a string',
    );
  }

  /**
   * VISIBILITY
   */

  if (
    payload.visibility &&
    !VALID_VISIBILITIES.includes(payload.visibility)
  ) {
    throw new ApiError(
      400,
      ERROR_CODES.BAD_REQUEST,
      'Invalid board visibility',
    );
  }

  /**
   * TYPE
   */

  if (
    payload.type &&
    !VALID_BOARD_TYPES.includes(payload.type)
  ) {
    throw new ApiError(
      400,
      ERROR_CODES.BAD_REQUEST,
      'Invalid board type',
    );
  }
}

/**
 * =========================================================
 * UPDATE BOARD VALIDATION
 * =========================================================
 */

export function validateUpdateBoardPayload(
  payload: UpdateBoardDto,
): void {
  /**
   * NAME
   */

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string') {
      throw new ApiError(
        400,
        ERROR_CODES.BAD_REQUEST,
        'Board name must be a string',
      );
    }

    if (!payload.name.trim()) {
      throw new ApiError(
        400,
        ERROR_CODES.BAD_REQUEST,
        'Board name cannot be empty',
      );
    }

    if (payload.name.trim().length > 255) {
      throw new ApiError(
        400,
        ERROR_CODES.BAD_REQUEST,
        'Board name must not exceed 255 characters',
      );
    }
  }

  /**
   * DESCRIPTION
   */

  if (
    payload.description !== undefined &&
    typeof payload.description !== 'string'
  ) {
    throw new ApiError(
      400,
      ERROR_CODES.BAD_REQUEST,
      'Description must be a string',
    );
  }

  /**
   * VISIBILITY
   */

  if (
    payload.visibility &&
    !VALID_VISIBILITIES.includes(payload.visibility)
  ) {
    throw new ApiError(
      400,
      ERROR_CODES.BAD_REQUEST,
      'Invalid board visibility',
    );
  }

  /**
   * TYPE
   */

  if (
    payload.type &&
    !VALID_BOARD_TYPES.includes(payload.type)
  ) {
    throw new ApiError(
      400,
      ERROR_CODES.BAD_REQUEST,
      'Invalid board type',
    );
  }
}
