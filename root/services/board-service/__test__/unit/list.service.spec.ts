import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockListRepository } = vi.hoisted(() => ({
  mockListRepository: {
    findBoardByPublicId: vi.fn(),
    create: vi.fn(),
    updateName: vi.fn(),
    softDelete: vi.fn(),
  },
}));

const { mockDb, mockDbTransaction, mockTx } = vi.hoisted(() => {
  const mockTx = {};

  const mockDbTransaction = vi.fn();

  return { mockDb: { transaction: mockDbTransaction }, mockDbTransaction, mockTx };
});

vi.mock('@/board-service/config/database', () => ({ db: mockDb }));
vi.mock('@/board-service/repositories/list.repository', () => ({ ListRepository: function () { return mockListRepository; } }));

const { mockApiError, mockErrorCodes } = vi.hoisted(() => {
  const ERROR_CODES = {
    BAD_REQUEST: 'BAD_REQUEST',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    BOARD_NOT_FOUND: 'BOARD_NOT_FOUND',
    LIST_NOT_FOUND: 'LIST_NOT_FOUND',
    CARD_NOT_FOUND: 'CARD_NOT_FOUND',
    LABEL_NOT_FOUND: 'LABEL_NOT_FOUND',
    MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
  };

  class ApiError extends Error {
    statusCode: number;
    code: string;
    constructor(statusCode: number, code: string, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
    }
  }

  return { mockApiError: ApiError, mockErrorCodes: ERROR_CODES };
});

vi.mock('@/board-service/shared/errors', () => ({ ApiError: mockApiError, ERROR_CODES: mockErrorCodes }));

import { ListService } from '../../services/list.service';

describe('ListService', () => {
  let listService: ListService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbTransaction.mockImplementation(async (callback: (tx: any) => any) => callback(mockTx));
    listService = new ListService();
  });

  describe('createList', () => {
    const userId = 'user-1';
    const boardPublicId = 'board_pub_1';

    const mockBoard = { id: 100, publicId: 'board_pub_1', name: 'Test Board', workspaceId: 1000 };
    const mockCreatedList = {
      id: 1,
      publicId: 'list_pub_1',
      name: 'Todo',
      index: 0,
      boardId: 100,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    };

    it('UT-051 should throw validation error when body is empty', async () => {
      await expect(listService.createList(userId, boardPublicId, {} as any)).rejects.toThrow(mockApiError);
      expect(mockListRepository.findBoardByPublicId).not.toHaveBeenCalled();
    });

    it('UT-052 should throw validation error when name is not string', async () => {
      await expect(listService.createList(userId, boardPublicId, { name: 123 } as any)).rejects.toThrow(mockApiError);
      expect(mockListRepository.findBoardByPublicId).not.toHaveBeenCalled();
    });

    it('UT-053 should throw validation error when name is whitespace only', async () => {
      await expect(listService.createList(userId, boardPublicId, { name: ' ' })).rejects.toThrow(mockApiError);
      expect(mockListRepository.findBoardByPublicId).not.toHaveBeenCalled();
    });

    it('UT-054 should throw not found when board does not exist', async () => {
      mockListRepository.findBoardByPublicId.mockResolvedValue(null);

      await expect(listService.createList(userId, boardPublicId, { name: 'Todo' })).rejects.toThrow(mockApiError);
      expect(mockListRepository.findBoardByPublicId).toHaveBeenCalledWith(boardPublicId);
      expect(mockListRepository.create).not.toHaveBeenCalled();
    });

    it('UT-055 should trim and save list name', async () => {
      mockListRepository.findBoardByPublicId.mockResolvedValue(mockBoard);
      mockListRepository.create.mockResolvedValue({ ...mockCreatedList, name: 'Todo' });

      const result = await listService.createList(userId, boardPublicId, { name: ' Todo ' });

      expect(mockDbTransaction).toHaveBeenCalledTimes(1);
      expect(mockListRepository.create).toHaveBeenCalledWith(mockTx, {
        name: 'Todo',
        boardInternalId: 100,
        createdBy: userId,
      });
      expect(result.name).toBe('Todo');
    });

    it('UT-056 should create list successfully with valid data', async () => {
      mockListRepository.findBoardByPublicId.mockResolvedValue(mockBoard);
      mockListRepository.create.mockResolvedValue(mockCreatedList);

      const result = await listService.createList(userId, boardPublicId, { name: 'Todo' });

      expect(mockDbTransaction).toHaveBeenCalledTimes(1);
      expect(mockListRepository.create).toHaveBeenCalledWith(mockTx, {
        name: 'Todo',
        boardInternalId: 100,
        createdBy: userId,
      });
      expect(result).toEqual(mockCreatedList);
    });
  });

  describe('updateList', () => {
    const userId = 'user-1';
    const listPublicId = 'list_pub_1';

    const mockUpdatedList = {
      id: 1,
      publicId: 'list_pub_1',
      name: 'Doing',
      index: 0,
      boardId: 100,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    it('UT-057 should throw validation error when body is empty', async () => {
      await expect(listService.updateList(userId, listPublicId, {} as any)).rejects.toThrow(mockApiError);
      expect(mockListRepository.updateName).not.toHaveBeenCalled();
    });

    it('UT-058 should throw validation error when name is not string', async () => {
      await expect(listService.updateList(userId, listPublicId, { name: 123 } as any)).rejects.toThrow(mockApiError);
      expect(mockListRepository.updateName).not.toHaveBeenCalled();
    });

    it('UT-059 should throw validation error when name is whitespace only', async () => {
      await expect(listService.updateList(userId, listPublicId, { name: ' ' })).rejects.toThrow(mockApiError);
      expect(mockListRepository.updateName).not.toHaveBeenCalled();
    });

    it('UT-060 should throw not found when list does not exist', async () => {
      mockListRepository.updateName.mockResolvedValue(null);

      await expect(listService.updateList(userId, listPublicId, { name: 'Doing' })).rejects.toThrow(mockApiError);
      expect(mockListRepository.updateName).toHaveBeenCalledWith(listPublicId, 'Doing');
    });

    it('UT-061 should trim and save list name', async () => {
      mockListRepository.updateName.mockResolvedValue({ ...mockUpdatedList, name: 'Doing' });

      const result = await listService.updateList(userId, listPublicId, { name: ' Doing ' });

      expect(mockListRepository.updateName).toHaveBeenCalledWith(listPublicId, 'Doing');
      expect(result.name).toBe('Doing');
    });

    it('UT-062 should update list successfully with valid data', async () => {
      mockListRepository.updateName.mockResolvedValue(mockUpdatedList);

      const result = await listService.updateList(userId, listPublicId, { name: 'Doing' });

      expect(mockListRepository.updateName).toHaveBeenCalledWith(listPublicId, 'Doing');
      expect(result).toEqual(mockUpdatedList);
    });
  });

  describe('deleteList', () => {
    const userId = 'user-1';
    const listPublicId = 'list_pub_1';

    const mockDeletedList = {
      id: 1,
      publicId: 'list_pub_1',
      name: 'To Do',
      index: 0,
      boardId: 100,
      createdBy: 'user-2',
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: new Date(),
      deletedBy: userId,
    };

    it('UT-063 should throw not found when list does not exist', async () => {
      mockListRepository.softDelete.mockResolvedValue(null);

      await expect(listService.deleteList(userId, listPublicId)).rejects.toThrow(mockApiError);
      expect(mockListRepository.softDelete).toHaveBeenCalledWith(listPublicId, userId);
    });

    it('UT-064 should soft delete list successfully', async () => {
      mockListRepository.softDelete.mockResolvedValue(mockDeletedList);

      const result = await listService.deleteList(userId, listPublicId);

      expect(mockListRepository.softDelete).toHaveBeenCalledWith(listPublicId, userId);
      expect(result).toBeUndefined();
    });
  });
});
