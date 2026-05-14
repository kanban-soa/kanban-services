import { BoardRepository } from '../repositories/board.repository';
// import { workspaceService } from '../shared/workspace.client';
import { ApiError, ERROR_CODES } from '../shared/errors';

export class BoardService {
  private readonly boardRepository = new BoardRepository();

  async createBoard(userId: string, workspaceId: number, data: any) {
    // await workspaceService.validateWorkspace(workspaceId);
    // await workspaceService.validateMember(workspaceId, userId);

    return this.boardRepository.create({
      ...data,
      workspaceId,
      createdBy: userId,
    });
  }

  async getBoards(userId: string, workspaceId: number) {
    // await workspaceService.validateWorkspace(workspaceId);
    // await workspaceService.validateMember(workspaceId, userId);

    return this.boardRepository.findAllByWorkspace(workspaceId);
  }

  async getBoardById(userId: string, workspaceId: number, boardId: string) {
    // await workspaceService.validateWorkspace(workspaceId);
    // await workspaceService.validateMember(workspaceId, userId);

    const board = await this.boardRepository.findById(boardId, workspaceId);
    if (!board) {
      throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
    }
    return board;
  }

  async updateBoard(userId: string, workspaceId: number, boardId: string, data: any) {
    // await workspaceService.validateWorkspace(workspaceId);
    // await workspaceService.validateMember(workspaceId, userId);

    const board = await this.boardRepository.findById(boardId, workspaceId);
    if (!board) {
      throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
    }

    return this.boardRepository.update(boardId, workspaceId, data);
  }

  async deleteBoard(userId: string, workspaceId: number, boardId: string) {
    // await workspaceService.validateWorkspace(workspaceId);
    // await workspaceService.validateMember(workspaceId, userId);

    const board = await this.boardRepository.findById(boardId, workspaceId);
    if (!board) {
      throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
    }

    await this.boardRepository.softDelete(boardId, workspaceId, userId);
  }

  async getBoardDetail(userId: string, workspaceId: number, boardId: string) {
    // await workspaceService.validateWorkspace(workspaceId);
    // await workspaceService.validateMember(workspaceId, userId);

    const boardDetail = await this.boardRepository.findBoardWithDetail(boardId, workspaceId);
    if (!boardDetail) {
      throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
    }
    return boardDetail;
  }
}
