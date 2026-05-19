import { db } from '@/board-service/config/database';
import { ListRepository } from '@/board-service/repositories/list.repository';
import { ApiError, ERROR_CODES } from '@/board-service/shared/errors';

export class ListService {
  private readonly listRepository = new ListRepository();

  async getLists(_userId: string, workspaceId: number, boardPublicId: string) {
    const board = await this.listRepository.findBoardByPublicId(boardPublicId, workspaceId);
    if (!board) {
      throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
    }
    return this.listRepository.findManyByBoardId(board.id);
  }

  async createList(
    userId: string,
    workspaceId: number,
    boardPublicId: string,
    body: { name: string },
  ) {
    if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'List name is required');
    }

    const board = await this.listRepository.findBoardByPublicId(boardPublicId, workspaceId);
    if (!board) {
      throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
    }

    return db.transaction(async (tx) => {
      return this.listRepository.create(tx, {
        name: body.name.trim(),
        boardInternalId: board.id,
        createdBy: userId,
      });
    });
  }

  async updateList(userId: string, workspaceId: number, listPublicId: string, body: { name: string }) {
    if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'List name is required');
    }

    const updated = await this.listRepository.updateName(listPublicId, workspaceId, body.name.trim());
    if (!updated) {
      throw new ApiError(404, ERROR_CODES.LIST_NOT_FOUND, 'List not found');
    }
    return updated;
  }

  async deleteList(userId: string, workspaceId: number, listPublicId: string) {
    const deleted = await this.listRepository.softDelete(listPublicId, workspaceId, userId);
    if (!deleted) {
      throw new ApiError(404, ERROR_CODES.LIST_NOT_FOUND, 'List not found');
    }
  }

  async reorderLists(workspaceId: number, boardPublicId: string, listIds: string[]) {
    if (!Array.isArray(listIds) || listIds.length === 0) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'listIds must be a non-empty array');
    }

    const result = await this.listRepository.reorderBoardLists(boardPublicId, workspaceId, listIds);
    if (!result.ok) {
      if (result.reason === 'BOARD_NOT_FOUND') {
        throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
      }
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'Invalid listIds for this board');
    }
  }
}
