import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockLabelRepository } = vi.hoisted(() => ({
  mockLabelRepository: {
    findBoardInternal: vi.fn(),
    create: vi.fn(),
    findByPublicOnBoard: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
}));

const { mockDb, mockDbTransaction, mockTx } = vi.hoisted(() => {
  const mockTx = {};

  const mockDbTransaction = vi.fn();

  return { mockDb: { transaction: mockDbTransaction }, mockDbTransaction, mockTx };
});

vi.mock('@/board-service/config/database', () => ({ db: mockDb }));
vi.mock('@/board-service/repositories/label.repository', () => ({ LabelRepository: function () { return mockLabelRepository; } }));

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

const { mockLabelMapper } = vi.hoisted(() => ({
  mockLabelMapper: {
    toResponseDto: vi.fn(),
    toResponseDtos: vi.fn(),
  },
}));

vi.mock('../../api/mapper/label.mapper', () => ({ LabelMapper: mockLabelMapper }));

import { LabelService } from '../../services/label.service';

describe('LabelService', () => {
  let labelService: LabelService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbTransaction.mockImplementation(async (callback: (tx: any) => any) => callback(mockTx));
    labelService = new LabelService();
  });

  describe('createLabel', () => {
    const userId = 'user-1';
    const boardPublicId = 'board_pub_1';

    const mockBoard = { id: 100, publicId: 'board_pub_1', name: 'Test Board' };
    const mockCreatedLabel = {
      id: 1,
      publicId: 'label_pub_1',
      name: 'Bug',
      colourCode: null,
      boardId: 100,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    };

    it('UT-065 should throw validation error when body is empty', async () => {
      await expect(labelService.createLabel(userId, boardPublicId, {} as any)).rejects.toThrow(mockApiError);
      expect(mockLabelRepository.findBoardInternal).not.toHaveBeenCalled();
    });

    it('UT-066 should throw validation error when name is not string', async () => {
      await expect(labelService.createLabel(userId, boardPublicId, { name: 123 } as any)).rejects.toThrow(mockApiError);
      expect(mockLabelRepository.findBoardInternal).not.toHaveBeenCalled();
    });

    it('UT-067 should throw validation error when name is whitespace only', async () => {
      await expect(labelService.createLabel(userId, boardPublicId, { name: ' ' })).rejects.toThrow(mockApiError);
      expect(mockLabelRepository.findBoardInternal).not.toHaveBeenCalled();
    });

    it('UT-068 should throw not found when board does not exist', async () => {
      mockLabelRepository.findBoardInternal.mockResolvedValue(null);

      await expect(labelService.createLabel(userId, boardPublicId, { name: 'Bug' })).rejects.toThrow(mockApiError);
      expect(mockLabelRepository.findBoardInternal).toHaveBeenCalledWith(boardPublicId);
    });

    it('UT-069 should trim and save label name', async () => {
      mockLabelRepository.findBoardInternal.mockResolvedValue(mockBoard);
      mockLabelRepository.create.mockResolvedValue({ ...mockCreatedLabel, name: 'Bug' });

      const result = await labelService.createLabel(userId, boardPublicId, { name: ' Bug ' });


      expect(mockLabelRepository.create).toHaveBeenCalledWith(mockTx, {
        name: 'Bug',
        colourCode: null,
        boardInternalId: 100,
        createdBy: userId,
      });
      expect(result.name).toBe('Bug');
      expect(mockDbTransaction).toHaveBeenCalledTimes(1);
    });

    it('UT-070 should create label successfully with valid data', async () => {
      mockLabelRepository.findBoardInternal.mockResolvedValue(mockBoard);
      mockLabelRepository.create.mockResolvedValue(mockCreatedLabel);

      const result = await labelService.createLabel(userId, boardPublicId, { name: 'Bug' });

      expect(mockDbTransaction).toHaveBeenCalled();
      expect(mockLabelRepository.create).toHaveBeenCalledWith(mockTx, {
        name: 'Bug',
        colourCode: null,
        boardInternalId: 100,
        createdBy: userId,
      });
      expect(result).toEqual(mockCreatedLabel);
    });
  });

  describe('updateLabel', () => {
    const boardPublicId = 'board_pub_1';
    const labelPublicId = 'label_pub_1';

    const mockBoard = { id: 100, publicId: 'board_pub_1', name: 'Test Board' };
    const mockLabel = { id: 1, publicId: 'label_pub_1', name: 'Bug', colourCode: '#ff0000', boardId: 100 };
    const mockUpdatedLabel = {
      id: 1,
      publicId: 'label_pub_1',
      name: 'Feature',
      colourCode: null,
      boardId: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockLabelRepository.findBoardInternal.mockResolvedValue(mockBoard);
      mockLabelRepository.findByPublicOnBoard.mockResolvedValue(mockLabel);
    });

    it('UT-071 should throw validation error when name is empty string', async () => {
      await expect(labelService.updateLabel(boardPublicId, labelPublicId, { name: '' })).rejects.toThrow(mockApiError);
      expect(mockLabelRepository.findBoardInternal).not.toHaveBeenCalled();
    });

    it('UT-072 should throw validation error when name is whitespace only', async () => {
      await expect(labelService.updateLabel(boardPublicId, labelPublicId, { name: ' ' })).rejects.toThrow(mockApiError);
      expect(mockLabelRepository.findBoardInternal).not.toHaveBeenCalled();
    });

    it('UT-073 should throw not found when board does not exist', async () => {
      mockLabelRepository.findBoardInternal.mockResolvedValue(null);

      await expect(labelService.updateLabel(boardPublicId, labelPublicId, { name: 'Feature' })).rejects.toThrow(mockApiError);
      expect(mockLabelRepository.findBoardInternal).toHaveBeenCalledWith(boardPublicId);
      expect(mockLabelRepository.findByPublicOnBoard).not.toHaveBeenCalled();
    });

    it('UT-074 should throw not found when label does not exist', async () => {
      mockLabelRepository.findByPublicOnBoard.mockResolvedValue(null);

      await expect(labelService.updateLabel(boardPublicId, labelPublicId, { name: 'Feature' })).rejects.toThrow(mockApiError);
      expect(mockLabelRepository.findByPublicOnBoard).toHaveBeenCalledWith(labelPublicId, 100);
    });

    it('UT-075 should trim and save label name', async () => {
      mockLabelRepository.update.mockResolvedValue(mockUpdatedLabel);
      mockLabelMapper.toResponseDto.mockReturnValue({
        publicId: 'label_pub_1',
        name: 'Feature',
        colourCode: null,
        createdAt: mockUpdatedLabel.createdAt,
      });

      const result = await labelService.updateLabel(boardPublicId, labelPublicId, { name: ' Feature ' });

      expect(mockLabelRepository.update).toHaveBeenCalledWith(mockTx, 1, {
        name: 'Feature',
        colourCode: null,
      });
      expect(result.name).toBe('Feature');
      expect(mockDbTransaction).toHaveBeenCalledTimes(1);
    });

    it('UT-076 should update label name successfully', async () => {
      mockLabelRepository.update.mockResolvedValue(mockUpdatedLabel);
      mockLabelMapper.toResponseDto.mockReturnValue({
        publicId: 'label_pub_1',
        name: 'Feature',
        colourCode: null,
        createdAt: mockUpdatedLabel.createdAt,
      });

      const result = await labelService.updateLabel(boardPublicId, labelPublicId, { name: 'Feature' });

      expect(mockDbTransaction).toHaveBeenCalled();
      expect(mockLabelRepository.update).toHaveBeenCalledWith(mockTx, 1, {
        name: 'Feature',
        colourCode: null,
      });
      expect(mockLabelMapper.toResponseDto).toHaveBeenCalledWith(mockUpdatedLabel);
      expect(result).toEqual({
        publicId: 'label_pub_1',
        name: 'Feature',
        colourCode: null,
        createdAt: mockUpdatedLabel.createdAt,
      });
    });

    it('UT-077 should update label colourCode successfully', async () => {
      const mockUpdatedColourLabel = { ...mockUpdatedLabel, name: 'Bug', colourCode: '#00ff00' };
      mockLabelRepository.update.mockResolvedValue(mockUpdatedColourLabel);
      mockLabelMapper.toResponseDto.mockReturnValue({
        publicId: 'label_pub_1',
        name: 'Bug',
        colourCode: '#00ff00',
        createdAt: mockUpdatedColourLabel.createdAt,
      });

      const result = await labelService.updateLabel(boardPublicId, labelPublicId, { colourCode: '#00ff00' });

      expect(mockLabelRepository.update).toHaveBeenCalledWith(mockTx, 1, {
        name: undefined,
        colourCode: '#00ff00',
      });
      expect(mockLabelMapper.toResponseDto).toHaveBeenCalledWith(mockUpdatedColourLabel);
      expect(result.colourCode).toBe('#00ff00');
    });
  });

  describe('deleteLabel', () => {
    const userId = 'user-1';
    const boardPublicId = 'board_pub_1';
    const labelPublicId = 'label_pub_1';

    const mockBoard = { id: 100, publicId: 'board_pub_1', name: 'Test Board' };

    beforeEach(() => {
      mockLabelRepository.findBoardInternal.mockResolvedValue(mockBoard);
    });

    it('UT-078 should throw not found when board does not exist', async () => {
      mockLabelRepository.findBoardInternal.mockResolvedValue(null);

      await expect(labelService.deleteLabel(userId, boardPublicId, labelPublicId)).rejects.toThrow(mockApiError);
      expect(mockLabelRepository.findBoardInternal).toHaveBeenCalledWith(boardPublicId);
      expect(mockLabelRepository.softDelete).not.toHaveBeenCalled();
    });

    it('UT-079 should throw not found when label does not exist', async () => {
      mockLabelRepository.softDelete.mockResolvedValue(null);

      await expect(labelService.deleteLabel(userId, boardPublicId, labelPublicId)).rejects.toThrow(mockApiError);
      expect(mockLabelRepository.softDelete).toHaveBeenCalledWith(userId, labelPublicId);
    });

    it('UT-080 should soft delete label successfully', async () => {
      const mockDeletedLabel = {
        id: 1,
        publicId: 'label_pub_1',
        name: 'Bug',
        colourCode: '#ff0000',
        boardId: 100,
        deletedAt: new Date(),
        deletedBy: userId,
      };
      mockLabelRepository.softDelete.mockResolvedValue(mockDeletedLabel);

      const result = await labelService.deleteLabel(userId, boardPublicId, labelPublicId);

      expect(mockLabelRepository.softDelete).toHaveBeenCalledWith(userId, labelPublicId);
      expect(result).toBeUndefined();
    });
  });
});
