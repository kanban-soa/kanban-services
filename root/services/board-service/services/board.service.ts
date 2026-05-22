import { BoardRepository } from '../repositories/board.repository';
import { NoopBoardActivityEmitter, type BoardActivityEmitter } from '../shared/board-activity.emitter';
// import { workspaceService } from '../shared/workspace.client';
import { authService } from '../shared/auth.client';
import { ApiError, ERROR_CODES } from '../shared/errors';

export class BoardService {
  private readonly boardRepository = new BoardRepository();
  private readonly activityEmitter: BoardActivityEmitter;

  constructor(activityEmitter: BoardActivityEmitter = new NoopBoardActivityEmitter()) {
    this.activityEmitter = activityEmitter;
  }

  async createBoard(userId: string, workspaceId: number, data: any) {
    // await workspaceService.validateWorkspace(workspaceId);
    // await workspaceService.validateMember(workspaceId, userId);

    const newBoard = await this.boardRepository.create({
      ...data,
      workspaceId,
      createdBy: userId,
    });

    void this.activityEmitter.boardCreated({
      workspaceId,
      actorUserId: userId,
      boardId: newBoard.publicId,
      name: newBoard.name,
    });

    return newBoard;
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

    const updatedBoard = await this.boardRepository.update(boardId, workspaceId, data);

    const updatedFields = Object.keys(data ?? {});
    void this.activityEmitter.boardUpdated({
      workspaceId,
      actorUserId: userId,
      boardId: updatedBoard?.publicId ?? boardId,
      fields: updatedFields,
    });

    return updatedBoard;
  }

  async deleteBoard(userId: string, workspaceId: number, boardId: string) {
    // await workspaceService.validateWorkspace(workspaceId);
    // await workspaceService.validateMember(workspaceId, userId);

    const deletedBoard = await this.boardRepository.softDelete(boardId, workspaceId, userId);

    if (deletedBoard) {
      void this.activityEmitter.boardDeleted({
        workspaceId,
        actorUserId: userId,
        boardId: deletedBoard.publicId ?? boardId,
        name: deletedBoard.name,
      });
    }

    await this.boardRepository.softDelete(boardId, workspaceId, userId);
  }

  async getBoardDetail(
    userId: string,
    workspaceId: number,
    boardId: string
  ): Promise<BoardDetailResponseDto> {
    const boardDetail = await this.boardRepository.findBoardWithDetail(boardId, workspaceId);

    if (!boardDetail) {
      throw new ApiError(404, ERROR_CODES.BOARD_NOT_FOUND, 'Board not found');
    }

    let creator = undefined;
    if (boardDetail.createdBy) {
      try {
        const authUser = await authService.getUserById(boardDetail.createdBy);
        creator = {
          id: authUser.id,
          name: authUser.name || null,
          image: authUser.image || null,
        };
      } catch (error) {
        console.error('Failed to fetch board creator info:', error);
      }
    }

    const dto = BoardMapper.toDetailDto(boardDetail);
    return { ...dto, creator };
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