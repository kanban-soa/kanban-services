import { BoardRepository } from '../repositories/board.repository';

export class BoardService {
  private readonly boardRepository = new BoardRepository();

  async createBoard(data: { name: string; workspaceId: string }) {
    return this.boardRepository.create(data);
  }

  async getBoardById(boardId: string) {
    return this.boardRepository.findById(boardId);
  }

  async getBoardsByWorkspaceId(workspaceId: string) {
    return this.boardRepository.findByWorkspaceId(workspaceId);
  }

  async updateBoard(
    boardId: string,
    data: { name?: string; description?: string },
  ) {
    return this.boardRepository.update(boardId, data);
  }

  async deleteBoardsByWorkspaceId(workspaceId: string, deletedBy: string) {
    return this.boardRepository.softDeleteByWorkspaceId(workspaceId, deletedBy);
  }
}
