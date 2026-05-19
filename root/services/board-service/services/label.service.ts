import { LabelRepository } from '@/board-service/repositories/label.repository';
import { ApiError, ERROR_CODES } from '@/board-service/shared/errors';
import { db } from '@/board-service/config/database';

export class LabelService {
  private readonly labelRepository = new LabelRepository();

  async getLabels(_userId: string, workspaceId: number, boardPublicId: string) {
    const board = await this.labelRepository.findBoardInternal(boardPublicId, workspaceId);
    if (!board) {
      throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
    }
    return this.labelRepository.findManyByBoard(board.id);
  }

  async createLabel(
    userId: string,
    workspaceId: number,
    boardPublicId: string,
    body: { name: string; colourCode?: string | null },
  ) {
    if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'Label name is required');
    }

    const board = await this.labelRepository.findBoardInternal(boardPublicId, workspaceId);
    if (!board) {
      throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
    }

    return db.transaction(async (tx) => {
      return this.labelRepository.create(tx, {
        name: body.name.trim(),
        colourCode: body.colourCode ?? null,
        boardInternalId: board.id,
        createdBy: userId,
      });
    });
  }
}
