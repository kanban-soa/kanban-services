import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockCardRepository } = vi.hoisted(() => ({
  mockCardRepository: {
    findManyByListPublicId: vi.fn(),
    findByPublicIdWithContext: vi.fn(),
    create: vi.fn(),
    getOrderedCardsInList: vi.fn(),
    setCardIndex: vi.fn(),
    setCardListAndIndex: vi.fn(),
    findLabelAssignment: vi.fn(),
    attachLabel: vi.fn(),
    detachLabel: vi.fn(),
    findMemberAssignment: vi.fn(),
    attachMember: vi.fn(),
    detachMember: vi.fn(),
  },
}));

const { mockLabelRepository } = vi.hoisted(() => ({
  mockLabelRepository: {
    findBoardInternal: vi.fn(),
    findManyByBoard: vi.fn(),
    findByPublicOnBoard: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    softDelete: vi.fn(),
  },
}));

const { mockDb, mockDbTransaction, mockTx, mockQueryBuilder } = vi.hoisted(() => {
  const mockQueryBuilder = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  };

  const mockTx = {
    update: vi.fn().mockReturnValue(mockQueryBuilder),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    query: {
      cards: { findMany: vi.fn() },
    },
  };

  const mockDbTransaction = vi.fn();

  return { mockDb: { transaction: mockDbTransaction }, mockDbTransaction, mockTx, mockQueryBuilder };
});

const { mockLabelMapper } = vi.hoisted(() => ({
  mockLabelMapper: {
    toResponseDto: vi.fn(),
  },
}));

vi.mock('@/board-service/api/mapper/label.mapper', () => ({
  LabelMapper: mockLabelMapper,
}));


vi.mock('@/board-service/config/database', () => ({ db: mockDb }));
vi.mock('@/board-service/repositories/card.repository', () => ({ CardRepository: function () { return mockCardRepository; } }));
vi.mock('@/board-service/repositories/label.repository', () => ({ LabelRepository: function () { return mockLabelRepository; } }));
vi.mock('@/board-service/shared/card-activity', () => ({ insertCardActivity: vi.fn() }));

const { mockApiError, mockErrorCodes } = vi.hoisted(() => {
  const ERROR_CODES = {
    BAD_REQUEST: 'BAD_REQUEST',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    CARD_NOT_FOUND: 'CARD_NOT_FOUND',
    LIST_NOT_FOUND: 'LIST_NOT_FOUND',
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
vi.mock('@/board-service/shared/auth.client', () => ({ authService: { getUserById: vi.fn(), getUsersByIds: vi.fn(), getUserByEmail: vi.fn() } }));
vi.mock('@/board-service/shared/noti.client', () => ({ notificationService: { createNotification: vi.fn() } }));

const { mockCardActivityEmitter } = vi.hoisted(() => ({
  mockCardActivityEmitter: {
    cardCreated: vi.fn(),
    cardUpdated: vi.fn(),
    cardDeleted: vi.fn(),
  },
}));

vi.mock('@/board-service/shared/card-activity.emitter', () => ({ ActivityCardEmitter: function () { return mockCardActivityEmitter; } }));
vi.mock('@/board-service/schema', () => ({ cards: {} }));
vi.mock('@/board-service/api/dto/card-response.dto');
vi.mock('@/board-service/api/mapper/card.mapper', () => ({ CardMapper: { toDetailDto: vi.fn() } }));

import { CardService } from '../../services/card.service';

describe('CardService', () => {
  let cardService: CardService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbTransaction.mockImplementation(async (callback: (tx: any) => any) => callback(mockTx));
    cardService = new CardService();
  });

  describe('createCard', () => {
    const userId = 'user-1';
    const listPublicId = 'list_pub_1';
    const validBody = { title: 'New Card' };

    const mockListBundle = {
      list: { id: 10, publicId: 'list_pub_1', name: 'To Do', boardId: 100, board: { id: 100, workspaceId: 1000 } },
      cards: [],
    };

    const mockCreatedCard = {
      id: 1,
      publicId: 'new_card_pub',
      title: 'New Card',
      description: null,
      index: 0,
      listId: 10,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
      dueDate: null,
    };

    it('UT-001 should throw validation error when title is empty', async () => {
      await expect(cardService.createCard(userId, listPublicId, { title: '' })).rejects.toThrow(mockApiError);
      expect(mockCardRepository.findManyByListPublicId).not.toHaveBeenCalled();
    });

    it('UT-002 should throw validation error when title is whitespace only', async () => {
      await expect(cardService.createCard(userId, listPublicId, { title: ' ' })).rejects.toThrow(mockApiError);
      expect(mockCardRepository.findManyByListPublicId).not.toHaveBeenCalled();
    });

    it('UT-003 should throw not found when list does not exist', async () => {
      mockCardRepository.findManyByListPublicId.mockResolvedValue(null);

      await expect(cardService.createCard(userId, listPublicId, validBody)).rejects.toThrow(mockApiError);
      expect(mockCardRepository.findManyByListPublicId).toHaveBeenCalledWith(listPublicId);
    });

    it('UT-004 should create a card successfully with valid data', async () => {
      mockCardRepository.findManyByListPublicId.mockResolvedValue(mockListBundle);
      mockCardRepository.create.mockResolvedValue(mockCreatedCard);

      const result = await cardService.createCard(userId, listPublicId, validBody);

      expect(mockCardRepository.create).toHaveBeenCalledWith(mockTx, {
        title: 'New Card',
        description: null,
        listInternalId: 10,
        createdBy: userId,
      });
      expect(result).toEqual(mockCreatedCard);
    });

    it('UT-005 should create activity when card is created successfully', async () => {
      mockCardRepository.findManyByListPublicId.mockResolvedValue(mockListBundle);
      mockCardRepository.create.mockResolvedValue(mockCreatedCard);

      await cardService.createCard(userId, listPublicId, validBody);

      expect(mockDbTransaction).toHaveBeenCalled();
      expect(mockCardActivityEmitter.cardCreated).toHaveBeenCalledWith({
        workspaceId: 1000,
        actorUserId: userId,
        cardId: 'new_card_pub',
        metadata: { name: 'New Card' },
      });
    });
  });

  describe('updateCard', () => {
    const userId = 'user-1';
    const cardPublicId = 'card_pub_1';

    const mockExistingCard = {
      id: 1,
      publicId: 'card_pub_1',
      title: 'Old Title',
      description: 'Old Desc',
      index: 0,
      list: { id: 10, publicId: 'list_pub_1', name: 'To Do', boardId: 100, board: { id: 100, workspaceId: 1000 } },
      labels: [],
      members: [],
    };

    const mockUpdatedRow = {
      id: 1,
      publicId: 'card_pub_1',
      title: 'New Title',
      description: 'New Desc',
      index: 0,
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockExistingCard);
    });

    it('UT-006 should throw not found when card does not exist', async () => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(null);

      await expect(cardService.updateCard(userId, cardPublicId, { title: 'New Title' })).rejects.toThrow(mockApiError);
    });

    it('UT-007 should throw validation error when title is empty', async () => {
      await expect(cardService.updateCard(userId, cardPublicId, { title: '' })).rejects.toThrow(mockApiError);
    });

    it('UT-008 should throw validation error when title is whitespace only', async () => {
      await expect(cardService.updateCard(userId, cardPublicId, { title: ' ' })).rejects.toThrow(mockApiError);
    });

    it('UT-009 should return existing card when body is empty', async () => {
      const result = await cardService.updateCard(userId, cardPublicId, {});

      expect(result).toEqual(mockExistingCard);
      expect(mockDbTransaction).not.toHaveBeenCalled();
      expect(mockCardActivityEmitter.cardUpdated).not.toHaveBeenCalled();
    });

    it('UT-010 should update title successfully', async () => {
      mockQueryBuilder.returning.mockResolvedValue([{ ...mockUpdatedRow, description: 'Old Desc' }]);

      const result = await cardService.updateCard(userId, cardPublicId, { title: 'New Title' });

      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result.title).toBe('New Title');
    });

    it('UT-011 should update description successfully', async () => {
      mockQueryBuilder.returning.mockResolvedValue([{ ...mockUpdatedRow, title: 'Old Title', description: 'New Desc' }]);

      const result = await cardService.updateCard(userId, cardPublicId, { description: 'New Desc' });

      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result.description).toBe('New Desc');
    });

    it('UT-012 should update both title and description', async () => {
      mockQueryBuilder.returning.mockResolvedValue([mockUpdatedRow]);

      const result = await cardService.updateCard(userId, cardPublicId, { title: 'New Title', description: 'New Desc' });

      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result.title).toBe('New Title');
      expect(result.description).toBe('New Desc');
    });

    it('UT-013 should create activity when card is updated successfully', async () => {
      mockQueryBuilder.returning.mockResolvedValue([mockUpdatedRow]);

      await cardService.updateCard(userId, cardPublicId, { title: 'New Title', description: 'New Desc' });

      expect(mockCardActivityEmitter.cardUpdated).toHaveBeenCalledWith({
        workspaceId: 1000,
        actorUserId: userId,
        cardId: 'card_pub_1',
        fields: ['title', 'description'],
        metadata: { name: 'New Title' },
      });
    });
  });

  describe('deleteCard', () => {
    const userId = 'user-1';
    const cardPublicId = 'card_pub_1';

    const mockExistingCard = {
      id: 1,
      publicId: 'card_pub_1',
      title: 'Card to Delete',
      description: null,
      index: 0,
      list: { id: 10, publicId: 'list_pub_1', boardId: 100, board: { id: 100, workspaceId: 1000 } },
      labels: [],
      members: [],
    };

    beforeEach(() => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockExistingCard);
    });

    it('UT-014 should throw not found when card does not exist', async () => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(null);

      await expect(cardService.deleteCard(userId, cardPublicId)).rejects.toThrow(mockApiError);
    });

    it('UT-015 should soft delete card and populate deletedAt', async () => {
      const mockDeletedRow = { ...mockExistingCard, deletedAt: new Date(), deletedBy: userId };
      mockQueryBuilder.returning.mockResolvedValue([mockDeletedRow]);

      await cardService.deleteCard(userId, cardPublicId);

      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(mockTx.update).toHaveBeenCalled();
    });

    it('UT-016 should create archived activity when card is deleted', async () => {
      mockQueryBuilder.returning.mockResolvedValue([{ ...mockExistingCard, deletedAt: new Date(), deletedBy: userId }]);

      await cardService.deleteCard(userId, cardPublicId);

      expect(mockCardActivityEmitter.cardDeleted).toHaveBeenCalledWith({
        workspaceId: 1000,
        actorUserId: userId,
        cardId: 'card_pub_1',
        metadata: { name: 'Card to Delete' },
      });
    });
  });

  describe('moveCard', () => {
    const userId = 'user-1';
    const cardPublicId = 'card_pub_1';

    const mockCard = {
      id: 1,
      publicId: 'card_pub_1',
      title: 'Moving Card',
      index: 0,
      list: { id: 10, publicId: 'list_pub_1', name: 'To Do', boardId: 100, board: { id: 100, workspaceId: 1000 } },
      labels: [],
      members: [],
    };

    const mockSameListBundle = {
      list: { id: 10, publicId: 'list_pub_1', name: 'To Do', boardId: 100, board: { id: 100, workspaceId: 1000 } },
      cards: [{ id: 1, publicId: 'card_pub_1', index: 0 }, { id: 2, publicId: 'card_pub_2', index: 1 }],
    };

    const mockOtherListBundle = {
      list: { id: 11, publicId: 'list_pub_2', name: 'In Progress', boardId: 100, board: { id: 100, workspaceId: 1000 } },
      cards: [{ id: 3, publicId: 'card_pub_3', index: 0 }],
    };

    const mockSourceCards = [
      { id: 1, publicId: 'card_pub_1', title: 'Moving Card', index: 0 },
      { id: 2, publicId: 'card_pub_2', title: 'Other Card', index: 1 },
    ];

    const mockTargetCardsEmpty: any[] = [];

    beforeEach(() => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockCard);
    });

    it('UT-017 should throw validation error when targetListId is missing', async () => {
      await expect(cardService.moveCard(userId, cardPublicId, {} as any)).rejects.toThrow(mockApiError);
    });

    it('UT-018 should throw validation error when newIndex is negative', async () => {
      await expect(cardService.moveCard(userId, cardPublicId, { targetListId: 'list_pub_2', newIndex: -1 })).rejects.toThrow(mockApiError);
    });

    it('UT-019 should throw not found when card does not exist', async () => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(null);

      await expect(cardService.moveCard(userId, cardPublicId, { targetListId: 'list_pub_2' })).rejects.toThrow(mockApiError);
    });

    it('UT-020 should throw not found when target list does not exist', async () => {
      mockCardRepository.findManyByListPublicId.mockResolvedValue(null);

      await expect(cardService.moveCard(userId, cardPublicId, { targetListId: 'nonexistent' })).rejects.toThrow(mockApiError);
    });

    it('UT-021 should throw validation error when target list belongs to a different board', async () => {
      const differentBoardList = {
        list: { id: 99, publicId: 'list_other_board', boardId: 999, board: { id: 999, workspaceId: 9999 } },
        cards: [],
      };
      mockCardRepository.findManyByListPublicId.mockResolvedValue(differentBoardList);

      await expect(cardService.moveCard(userId, cardPublicId, { targetListId: 'list_other_board' })).rejects.toThrow(mockApiError);
    });

    it('UT-022 should move card within the same list and update order', async () => {
      mockCardRepository.findManyByListPublicId.mockResolvedValue(mockSameListBundle);
      mockCardRepository.getOrderedCardsInList.mockResolvedValue(mockSourceCards);
      mockCardRepository.setCardIndex.mockResolvedValue(undefined);
      mockCardRepository.findByPublicIdWithContext
        .mockResolvedValueOnce(mockCard)
        .mockResolvedValueOnce({ ...mockCard, index: 1 });

      const result = await cardService.moveCard(userId, cardPublicId, { targetListId: 'list_pub_1', newIndex: 1 });

      expect(mockCardRepository.setCardIndex).toHaveBeenCalled();
      expect(mockCardRepository.setCardIndex.mock.calls.length).toBe(2);
      expect(result).toBeDefined();
    });

    it('UT-023 should reorder card within the same list and update index', async () => {
      const sourceCards = [
        { id: 1, publicId: 'card_pub_1', index: 0 },
        { id: 2, publicId: 'card_pub_2', index: 1 },
        { id: 3, publicId: 'card_pub_3', index: 2 },
      ];

      mockCardRepository.findManyByListPublicId.mockResolvedValue(mockSameListBundle);
      mockCardRepository.getOrderedCardsInList.mockResolvedValue(sourceCards);
      mockCardRepository.setCardIndex.mockResolvedValue(undefined);
      mockCardRepository.findByPublicIdWithContext
        .mockResolvedValueOnce(mockCard)
        .mockResolvedValueOnce({ ...mockCard, index: 2 });

      await cardService.moveCard(userId, cardPublicId, { targetListId: 'list_pub_1', newIndex: 2 });

      expect(mockCardRepository.setCardIndex).toHaveBeenCalled();
      expect(mockCardRepository.setCardIndex.mock.calls.length).toBe(3);
    });

    it('UT-024 should move card to a different list', async () => {
      mockCardRepository.findManyByListPublicId.mockResolvedValue(mockOtherListBundle);
      mockCardRepository.getOrderedCardsInList
        .mockResolvedValueOnce(mockSourceCards)
        .mockResolvedValueOnce(mockTargetCardsEmpty);
      mockCardRepository.setCardIndex.mockResolvedValue(undefined);
      mockCardRepository.setCardListAndIndex.mockResolvedValue(undefined);
      mockCardRepository.findByPublicIdWithContext
        .mockResolvedValueOnce(mockCard)
        .mockResolvedValueOnce({ ...mockCard, list: mockOtherListBundle.list });

      const result = await cardService.moveCard(userId, cardPublicId, { targetListId: 'list_pub_2' });

      expect(mockCardRepository.setCardListAndIndex).toHaveBeenCalled();
      expect(mockCardRepository.setCardIndex).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('UT-025 should create activity when card is moved successfully', async () => {
      mockCardRepository.findManyByListPublicId.mockResolvedValue(mockOtherListBundle);
      mockCardRepository.getOrderedCardsInList
        .mockResolvedValueOnce(mockSourceCards)
        .mockResolvedValueOnce(mockTargetCardsEmpty);
      mockCardRepository.setCardIndex.mockResolvedValue(undefined);
      mockCardRepository.setCardListAndIndex.mockResolvedValue(undefined);
      mockCardRepository.findByPublicIdWithContext
        .mockResolvedValueOnce(mockCard)
        .mockResolvedValueOnce({ ...mockCard, list: mockOtherListBundle.list });

      await cardService.moveCard(userId, cardPublicId, { targetListId: 'list_pub_2' });

      expect(mockCardActivityEmitter.cardUpdated).toHaveBeenCalledWith({
        workspaceId: 1000,
        actorUserId: userId,
        cardId: 'card_pub_1',
        fields: ['list', 'index'],
        metadata: expect.any(Object),
      });
    });
  });

  describe('patchDueDate', () => {
    const userId = 'user-1';
    const cardPublicId = 'card_pub_1';
    const dueDateStr = '2024-12-31T23:59:59Z';
    const dueDateParsed = new Date(dueDateStr);

    const mockCard = {
      id: 1,
      publicId: 'card_pub_1',
      title: 'Card',
      description: null,
      index: 0,
      dueDate: null,
      list: { id: 10, publicId: 'list_pub_1', boardId: 100, board: { id: 100, workspaceId: 1000 } },
      labels: [],
      members: [],
    };

    beforeEach(() => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockCard);
    });

    it('UT-026 should throw validation error when dueDate is missing', async () => {
      await expect(cardService.patchDueDate(userId, cardPublicId, {} as any)).rejects.toThrow(mockApiError);
    });

    it('UT-027 should throw validation error when dueDate is not a valid ISO date', async () => {
      await expect(cardService.patchDueDate(userId, cardPublicId, { dueDate: 'not-a-date' })).rejects.toThrow(mockApiError);
    });

    it('UT-028 should throw not found when card does not exist', async () => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(null);

      await expect(cardService.patchDueDate(userId, cardPublicId, { dueDate: dueDateStr })).rejects.toThrow(mockApiError);
    });

    it('UT-029 should add due date when card has no existing due date', async () => {
      const mockUpdated = { ...mockCard, dueDate: dueDateParsed, updatedAt: new Date() };
      mockQueryBuilder.returning.mockResolvedValue([mockUpdated]);

      const result = await cardService.patchDueDate(userId, cardPublicId, { dueDate: dueDateStr });

      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result.dueDate).toEqual(dueDateParsed);
    });

    it('UT-030 should update due date when card already has a due date', async () => {
      const existingDueDate = new Date('2024-06-15T12:00:00Z');
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue({ ...mockCard, dueDate: existingDueDate });

      const newDueDate = dueDateParsed;
      mockQueryBuilder.returning.mockResolvedValue([{ ...mockCard, dueDate: newDueDate, updatedAt: new Date() }]);

      const result = await cardService.patchDueDate(userId, cardPublicId, { dueDate: dueDateStr });

      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result.dueDate).toEqual(newDueDate);
    });
  });

  describe('deleteDueDate', () => {
    const userId = 'user-1';
    const cardPublicId = 'card_pub_1';

    const mockCardWithDueDate = {
      id: 1,
      publicId: 'card_pub_1',
      title: 'Card with Due Date',
      description: null,
      index: 0,
      dueDate: new Date('2024-12-31T23:59:59Z'),
      list: { id: 10, publicId: 'list_pub_1', boardId: 100, board: { id: 100, workspaceId: 1000 } },
      labels: [],
      members: [],
    };

    const mockCardWithoutDueDate = {
      ...mockCardWithDueDate,
      dueDate: null,
      title: 'Card without Due Date',
    };

    beforeEach(() => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockCardWithDueDate);
    });

    it('UT-031 should remove due date when card has a due date', async () => {
      const mockUpdated = { ...mockCardWithDueDate, dueDate: null, updatedAt: new Date() };
      mockQueryBuilder.returning.mockResolvedValue([mockUpdated]);

      const result = await cardService.deleteDueDate(userId, cardPublicId);

      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result.dueDate).toBeNull();
    });

    it('UT-032 should return existing card when card has no due date', async () => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockCardWithoutDueDate);

      const result = await cardService.deleteDueDate(userId, cardPublicId);

      expect(mockDbTransaction).not.toHaveBeenCalled();
      expect(result).toEqual(mockCardWithoutDueDate);
    });
  });

  describe('createAndAttachLabel', () => {
    const userId = 'user-1';
    const cardPublicId = 'card_pub_1';

    const mockCard = {
      id: 1,
      publicId: 'card_pub_1',
      title: 'Card',
      description: null,
      index: 0,
      list: { id: 10, publicId: 'list_pub_1', boardId: 100, board: { id: 100, workspaceId: 1000 } },
      labels: [],
      members: [],
    };

    const mockCreatedLabel = {
      id: 200,
      publicId: 'label_pub_new',
      name: 'Bug',
      colourCode: '#ff0000',
      createdAt: new Date(),
    };

    beforeEach(() => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockCard);
    });

    it('UT-033 should throw validation error when label name is missing', async () => {
      await expect(cardService.createAndAttachLabel(userId, cardPublicId, {} as any)).rejects.toThrow(mockApiError);
    });

    it('UT-034 should throw not found when card does not exist', async () => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(null);

      await expect(cardService.createAndAttachLabel(userId, cardPublicId, { name: 'Bug' })).rejects.toThrow(mockApiError);
    });

    it('UT-035 should create label and attach it to card successfully', async () => {
      mockLabelMapper.toResponseDto.mockReturnValue({
        publicId: 'label_pub_new',
        name: 'Bug',
        colourCode: '#ff0000',
        createdAt: new Date(),
      });

      mockLabelRepository.create.mockResolvedValue(mockCreatedLabel);

      const result = await cardService.createAndAttachLabel(
        userId,
        cardPublicId,
        { name: 'Bug' },
      );

      expect(result).toBeDefined();
    });

    it('UT-036 should create activity when label is created and attached', async () => {
      mockLabelRepository.create.mockResolvedValue(mockCreatedLabel);

      await cardService.createAndAttachLabel(userId, cardPublicId, { name: 'Bug' });

      expect(mockCardActivityEmitter.cardUpdated).toHaveBeenCalledWith({
        workspaceId: 1000,
        actorUserId: userId,
        cardId: 'card_pub_1',
        fields: ['label'],
        metadata: expect.objectContaining({ name: 'Card' }),
      });
    });
  });

  describe('attachLabel', () => {
    const userId = 'user-1';
    const cardPublicId = 'card_pub_1';
    const labelPublicId = 'label_pub_1';

    const mockCard = {
      id: 1,
      publicId: 'card_pub_1',
      title: 'Card',
      description: null,
      index: 0,
      list: { id: 10, publicId: 'list_pub_1', boardId: 100, board: { id: 100, workspaceId: 1000 } },
      labels: [],
      members: [],
    };

    const mockLabel = { id: 200, publicId: 'label_pub_1', name: 'Bug', colourCode: '#ff0000' };

    const mockRefreshedCard = { ...mockCard, labels: [{ label: mockLabel }] };

    beforeEach(() => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockCard);
      mockLabelRepository.findByPublicOnBoard.mockResolvedValue(mockLabel);
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockRefreshedCard);
    });

    it('UT-037 should throw validation error when labelId is missing', async () => {
      await expect(cardService.attachLabel(userId, cardPublicId, {} as any)).rejects.toThrow(mockApiError);
    });

    it('UT-038 should throw not found when label does not exist on board', async () => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockCard);
      mockLabelRepository.findByPublicOnBoard.mockResolvedValue(null);

      await expect(cardService.attachLabel(userId, cardPublicId, { labelId: labelPublicId })).rejects.toThrow(mockApiError);
    });

    it('UT-039 should throw conflict when label is already attached', async () => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockCard);
      mockLabelRepository.findByPublicOnBoard.mockResolvedValue(mockLabel);
      mockCardRepository.findLabelAssignment.mockResolvedValue({ cardId: 1, labelId: 200 });

      await expect(cardService.attachLabel(userId, cardPublicId, { labelId: labelPublicId })).rejects.toThrow(mockApiError);
    });

    it('UT-040 should attach label to card successfully', async () => {
      mockCardRepository.findByPublicIdWithContext
        .mockResolvedValueOnce(mockCard)
        .mockResolvedValueOnce(mockRefreshedCard);
      mockLabelRepository.findByPublicOnBoard.mockResolvedValue(mockLabel);
      mockCardRepository.findLabelAssignment.mockResolvedValue(null);
      mockCardRepository.attachLabel.mockResolvedValue(undefined);

      const result = await cardService.attachLabel(userId, cardPublicId, { labelId: labelPublicId });

      expect(mockCardRepository.attachLabel).toHaveBeenCalledWith(mockTx, 1, 200);
      expect(result).toEqual(mockRefreshedCard);
    });
  });

  describe('detachLabel', () => {
    const userId = 'user-1';
    const cardPublicId = 'card_pub_1';
    const labelPublicId = 'label_pub_1';

    const mockCard = {
      id: 1,
      publicId: 'card_pub_1',
      title: 'Card',
      description: null,
      index: 0,
      list: { id: 10, publicId: 'list_pub_1', boardId: 100, board: { id: 100, workspaceId: 1000 } },
      labels: [{ label: { id: 200, publicId: 'label_pub_1', name: 'Bug', colourCode: '#ff0000' } }],
      members: [],
    };

    const mockLabel = { id: 200, publicId: 'label_pub_1', name: 'Bug', colourCode: '#ff0000' };

    beforeEach(() => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockCard);
      mockLabelRepository.findByPublicOnBoard.mockResolvedValue(mockLabel);
    });

    it('UT-041 should throw not found when label is not attached to card', async () => {
      mockCardRepository.findLabelAssignment.mockResolvedValue(null);

      await expect(cardService.detachLabel(userId, cardPublicId, labelPublicId)).rejects.toThrow(mockApiError);
    });

    it('UT-042 should detach label from card successfully', async () => {
      mockCardRepository.findLabelAssignment.mockResolvedValue({ cardId: 1, labelId: 200 });
      mockCardRepository.detachLabel.mockResolvedValue(undefined);

      await cardService.detachLabel(userId, cardPublicId, labelPublicId);

      expect(mockCardRepository.detachLabel).toHaveBeenCalledWith(mockTx, 1, 200);
    });
  });

  describe('addMember', () => {
    const userId = 'user-1';
    const cardPublicId = 'card_pub_1';
    const workspaceMemberPublicId = 'mem_123';

    const mockCard = {
      id: 1,
      publicId: 'card_pub_1',
      title: 'Card',
      description: null,
      index: 0,
      list: { id: 10, publicId: 'list_pub_1', boardId: 100, board: { id: 100, workspaceId: 1000 } },
      labels: [],
      members: [],
    };

    beforeEach(() => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockCard);
    });

    it('UT-043 should throw validation error when workspaceMemberPublicId is missing', async () => {
      await expect(cardService.addMember(userId, cardPublicId, {} as any)).rejects.toThrow(mockApiError);
    });

    it('UT-044 should throw not found when card does not exist', async () => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(null);

      await expect(cardService.addMember(userId, cardPublicId, { workspaceMemberPublicId })).rejects.toThrow(mockApiError);
    });

    it('UT-045 should throw conflict when member is already assigned', async () => {
      mockCardRepository.findMemberAssignment.mockResolvedValue({ cardId: 1, workspaceMemberId: workspaceMemberPublicId });

      await expect(cardService.addMember(userId, cardPublicId, { workspaceMemberPublicId })).rejects.toThrow(mockApiError);
    });

    it('UT-046 should assign member to card successfully', async () => {
      mockCardRepository.findMemberAssignment.mockResolvedValue(null);
      mockCardRepository.attachMember.mockResolvedValue(undefined);

      const result = await cardService.addMember(userId, cardPublicId, { workspaceMemberPublicId });

      expect(mockCardRepository.attachMember).toHaveBeenCalledWith(mockTx, 1, 'mem_123');
      expect(result).toEqual({ success: true });
    });

    it('UT-047 should create activity when member is assigned', async () => {
      mockCardRepository.findMemberAssignment.mockResolvedValue(null);
      mockCardRepository.attachMember.mockResolvedValue(undefined);

      await cardService.addMember(userId, cardPublicId, { workspaceMemberPublicId });

      expect(mockCardActivityEmitter.cardUpdated).toHaveBeenCalledWith({
        workspaceId: 1000,
        actorUserId: userId,
        cardId: 'card_pub_1',
        fields: ['member'],
        metadata: { name: 'Card', workspaceMemberPublicId: 'mem_123' },
      });
    });
  });

  describe('removeMember', () => {
    const userId = 'user-1';
    const cardPublicId = 'card_pub_1';
    const workspaceMemberPublicId = 'mem_123';

    const mockCard = {
      id: 1,
      publicId: 'card_pub_1',
      title: 'Card',
      description: null,
      index: 0,
      list: { id: 10, publicId: 'list_pub_1', boardId: 100, board: { id: 100, workspaceId: 1000 } },
      labels: [],
      members: [{ workspaceMemberId: 'mem_123' }],
    };

    beforeEach(() => {
      mockCardRepository.findByPublicIdWithContext.mockResolvedValue(mockCard);
    });

    it('UT-048 should throw validation error when workspaceMemberPublicId is missing', async () => {
      await expect(cardService.removeMember(userId, cardPublicId, '' as any)).rejects.toThrow(mockApiError);
    });

    it('UT-049 should throw not found when member is not assigned', async () => {
      mockCardRepository.findMemberAssignment.mockResolvedValue(null);

      await expect(cardService.removeMember(userId, cardPublicId, workspaceMemberPublicId)).rejects.toThrow(mockApiError);
    });

    it('UT-050 should remove member from card successfully', async () => {
      mockCardRepository.findMemberAssignment.mockResolvedValue({ cardId: 1, workspaceMemberId: 'mem_123' });
      mockCardRepository.detachMember.mockResolvedValue(undefined);

      const result = await cardService.removeMember(userId, cardPublicId, workspaceMemberPublicId);

      expect(mockCardRepository.detachMember).toHaveBeenCalledWith(mockTx, 1, 'mem_123');
      expect(result).toEqual({ success: true });
    });
  });
});
