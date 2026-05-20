import { db } from '@/board-service/config/database';
import { ListRepository } from '@/board-service/repositories/list.repository';
import { ApiError, ERROR_CODES } from '@/board-service/shared/errors';

export class ListService {
  private readonly listRepository = new ListRepository();

  async getLists(_userId: string, workspacePublicId: Number, boardPublicId: string) {
    const board = await this.listRepository.findBoardByPublicId(boardPublicId);
    if (!board) {
      throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
    }
    return this.listRepository.findManyByBoardId(board.id);
  }

  async createList(
    userId: string,
    boardPublicId: string,
    body: { name: string },
  ) {
    if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'List name is required');
    }

    const board = await this.listRepository.findBoardByPublicId(boardPublicId);
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

  async updateList(userId: string, listPublicId: string, body: { name: string }) {
    console.log('Updated list:', { userId, listPublicId, body });
    if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'List name is required');
    }

    const updated = await this.listRepository.updateName(listPublicId, body.name.trim());
    if (!updated) {
      throw new ApiError(404, ERROR_CODES.LIST_NOT_FOUND, 'List not found');
    }
    console.log('Updated list:', updated);
    return updated;
  }

  async deleteList(userId: string, listPublicId: string) {
    const deleted = await this.listRepository.softDelete(listPublicId, userId);
    console.log('Deleted list:', { userId, listPublicId, deleted });
    if (!deleted) {
      throw new ApiError(404, ERROR_CODES.LIST_NOT_FOUND, 'List not found');
    }
  }

  // async reorderLists(workspaceId: number, boardPublicId: string, listIds: string[]) {
  //   if (!Array.isArray(listIds) || listIds.length === 0) {
  //     throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'listIds must be a non-empty array');
  //   }

  //   const result = await this.listRepository.reorderBoardLists(boardPublicId, workspaceId, listIds);
  //   if (!result.ok) {
  //     if (result.reason === 'BOARD_NOT_FOUND') {
  //       throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
  //     }
  //     throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'Invalid listIds for this board');
  //   }
  // }
}
