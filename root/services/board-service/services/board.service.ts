import { BoardRepository } from '../repositories/board.repository';

export class BoardService {
  private readonly boardRepository = new BoardRepository();

  async createBoard(data: { name: string; workspaceId: string }) {
    return this.boardRepository.create(data);
  }

  async getBoardById(boardId: string) {
    return this.boardRepository.findById(boardId);
  }

  async updateBoard(
    boardId: string,
    data: { name?: string; description?: string },
  ) {
    return this.boardRepository.update(boardId, data);
  }
}
