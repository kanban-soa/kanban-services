import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/board-service/config/database';
import { cards } from '@/board-service/schema';
import { CardRepository } from '@/board-service/repositories/card.repository';
import { LabelRepository } from '@/board-service/repositories/label.repository';
import { insertCardActivity } from '@/board-service/shared/card-activity';
import { ApiError, ERROR_CODES } from '@/board-service/shared/errors';
import { workspaceService } from '@/board-service/shared/workspace.client';

function parseWorkspaceMemberId(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    const direct = Number(trimmed);
    if (!Number.isNaN(direct) && trimmed !== '') return direct;
    const m = trimmed.match(/^mem_(\d+)$/i);
    if (m) return Number(m[1]);
  }
  return null;
}

export class CardService {
  private readonly cardRepository = new CardRepository();

  async getCards(_userId: string, workspaceId: number, listPublicId: string) {
    const result = await this.cardRepository.findManyByListPublicId(listPublicId, workspaceId);
    if (!result) {
      throw new ApiError(404, ERROR_CODES.LIST_NOT_FOUND, 'List not found');
    }
    return result.cards;
  }

  async createCard(
    userId: string,
    workspaceId: number,
    listPublicId: string,
    body: { title: string; description?: string | null },
  ) {
    if (!body?.title || typeof body.title !== 'string' || !body.title.trim()) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'Card title is required');
    }

    const listBundle = await this.cardRepository.findManyByListPublicId(listPublicId, workspaceId);
    if (!listBundle) {
      throw new ApiError(404, ERROR_CODES.LIST_NOT_FOUND, 'List not found');
    }

    return db.transaction(async (tx) => {
      const created = await this.cardRepository.create(tx, {
        title: body.title.trim(),
        description: body.description ?? null,
        listInternalId: listBundle.list.id,
        createdBy: userId,
      });

      await insertCardActivity(tx, {
        type: 'card.created',
        cardId: created.id,
        createdBy: userId,
      });

      return created;
    });
  }

  async getCard(_userId: string, workspaceId: number, cardPublicId: string) {
    const card = await this.cardRepository.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!card) {
      throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');
    }
    return card;
  }

  async updateCard(
    userId: string,
    workspaceId: number,
    cardPublicId: string,
    body: { title?: string; description?: string | null },
  ) {
    const existing = await this.cardRepository.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!existing) {
      throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');
    }

    const patch: { title?: string; description?: string | null } = {};
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || !body.title.trim()) {
        throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'Card title cannot be empty');
      }
      patch.title = body.title.trim();
    }
    if (body.description !== undefined) {
      patch.description = body.description;
    }

    if (Object.keys(patch).length === 0) {
      return existing;
    }

    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(cards)
        .set({ ...patch, updatedAt: new Date() })
        .where(and(eq(cards.publicId, cardPublicId), isNull(cards.deletedAt)))
        .returning();

      if (!row) throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');

      if (patch.title !== undefined && patch.title !== existing.title) {
        await insertCardActivity(tx, {
          type: 'card.updated.title',
          cardId: row.id,
          createdBy: userId,
          fromTitle: existing.title,
          toTitle: row.title,
        });
      }

      if (patch.description !== undefined && patch.description !== existing.description) {
        await insertCardActivity(tx, {
          type: 'card.updated.description',
          cardId: row.id,
          createdBy: userId,
          fromDescription: existing.description,
          toDescription: row.description,
        });
      }

      return row;
    });
  }

  async deleteCard(userId: string, workspaceId: number, cardPublicId: string) {
    const existing = await this.cardRepository.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!existing) {
      throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');
    }

    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(cards)
        .set({ deletedAt: new Date(), deletedBy: userId })
        .where(and(eq(cards.publicId, cardPublicId), isNull(cards.deletedAt)))
        .returning();

      if (!row) throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');

      await insertCardActivity(tx, {
        type: 'card.archived',
        cardId: row.id,
        createdBy: userId,
      });
    });
  }

  async moveCard(
    userId: string,
    workspaceId: number,
    cardPublicId: string,
    body: { targetListId: string; newIndex: number },
  ) {
    if (!body?.targetListId || typeof body.targetListId !== 'string') {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'targetListId is required');
    }
    if (typeof body.newIndex !== 'number' || !Number.isFinite(body.newIndex) || body.newIndex < 0) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'newIndex must be a non-negative number');
    }

    const card = await this.cardRepository.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!card) {
      throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');
    }

    const targetList = await this.cardRepository.findManyByListPublicId(body.targetListId, workspaceId);
    if (!targetList) {
      throw new ApiError(404, ERROR_CODES.LIST_NOT_FOUND, 'Target list not found');
    }

    const sourceBoardId = card.list.board.id;
    if (targetList.list.boardId !== sourceBoardId) {
      throw new ApiError(422, ERROR_CODES.VALIDATION_ERROR, 'Target list must belong to the same board');
    }

    const sourceListId = card.list.id;
    const targetListId = targetList.list.id;

    await db.transaction(async (tx) => {
      const sourceCards = await this.cardRepository.getOrderedCardsInList(tx, sourceListId);
      const moving = sourceCards.find((c) => c.publicId === cardPublicId);
      if (!moving) throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');

      const fromIndex = moving.index;
      const fromListId = sourceListId;

      if (sourceListId === targetListId) {
        const ordered = sourceCards.filter((c) => c.id !== moving.id);
        const boundedIndex = Math.min(body.newIndex, ordered.length);
        ordered.splice(boundedIndex, 0, moving);

        for (let i = 0; i < ordered.length; i++) {
          await this.cardRepository.setCardIndex(tx, ordered[i]!.id, i);
        }

        const toIndex = ordered.findIndex((c) => c.id === moving.id);

        if (fromListId === targetListId && fromIndex !== toIndex) {
          await insertCardActivity(tx, {
            type: 'card.updated.index',
            cardId: moving.id,
            createdBy: userId,
            fromIndex,
            toIndex,
            fromListId,
            toListId: targetListId,
          });
        }

        return;
      }

      const sourceWithout = sourceCards.filter((c) => c.id !== moving.id);
      for (let i = 0; i < sourceWithout.length; i++) {
        await this.cardRepository.setCardIndex(tx, sourceWithout[i]!.id, i);
      }

      const targetCards = await this.cardRepository.getOrderedCardsInList(tx, targetListId);
      const boundedIndex = Math.min(body.newIndex, targetCards.length);
      const newOrder = [...targetCards];
      newOrder.splice(boundedIndex, 0, moving);

      for (let i = 0; i < newOrder.length; i++) {
        await this.cardRepository.setCardListAndIndex(tx, newOrder[i]!.id, targetListId, i);
      }

      await insertCardActivity(tx, {
        type: 'card.updated.list',
        cardId: moving.id,
        createdBy: userId,
        fromListId,
        toListId: targetListId,
        fromIndex,
        toIndex: boundedIndex,
      });
    });

    const refreshed = await this.cardRepository.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!refreshed) {
      throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');
    }
    return refreshed;
  }

  async reorderCards(workspaceId: number, listPublicId: string, cardIds: string[]) {
    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'cardIds must be a non-empty array');
    }

    const result = await this.cardRepository.reorderListCards(listPublicId, workspaceId, cardIds);
    if (!result.ok) {
      if (result.reason === 'LIST_NOT_FOUND') {
        throw new ApiError(404, ERROR_CODES.LIST_NOT_FOUND, 'List not found');
      }
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'Invalid cardIds for this list');
    }
  }

  async patchDueDate(userId: string, workspaceId: number, cardPublicId: string, body: { dueDate: string }) {
    if (!body?.dueDate || typeof body.dueDate !== 'string') {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'dueDate is required');
    }

    const parsed = new Date(body.dueDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'dueDate must be a valid ISO date string');
    }

    const existing = await this.cardRepository.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!existing) {
      throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');
    }

    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(cards)
        .set({ dueDate: parsed, updatedAt: new Date() })
        .where(and(eq(cards.publicId, cardPublicId), isNull(cards.deletedAt)))
        .returning();

      if (!row) throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');

      const hadDue = existing.dueDate !== null && existing.dueDate !== undefined;
      const type = hadDue ? ('card.updated.dueDate.updated' as const) : ('card.updated.dueDate.added' as const);

      await insertCardActivity(tx, {
        type,
        cardId: row.id,
        createdBy: userId,
        fromDueDate: existing.dueDate,
        toDueDate: row.dueDate,
      });

      return row;
    });
  }

  async deleteDueDate(userId: string, workspaceId: number, cardPublicId: string) {
    const existing = await this.cardRepository.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!existing) {
      throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');
    }

    if (!existing.dueDate) {
      return existing;
    }

    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(cards)
        .set({ dueDate: null, updatedAt: new Date() })
        .where(and(eq(cards.publicId, cardPublicId), isNull(cards.deletedAt)))
        .returning();

      if (!row) throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');

      await insertCardActivity(tx, {
        type: 'card.updated.dueDate.removed',
        cardId: row.id,
        createdBy: userId,
        fromDueDate: existing.dueDate,
        toDueDate: null,
      });

      return row;
    });
  }

  async attachLabel(userId: string, workspaceId: number, cardPublicId: string, body: { labelId: string }) {
    if (!body?.labelId || typeof body.labelId !== 'string') {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'labelId is required');
    }

    const card = await this.cardRepository.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!card) {
      throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');
    }

    const labelRepo = new LabelRepository();
    const label = await labelRepo.findByPublicOnBoard(body.labelId, card.list.board.id);
    if (!label) {
      throw new ApiError(404, ERROR_CODES.LABEL_NOT_FOUND, 'Label not found on this board');
    }

    const dup = await this.cardRepository.findLabelAssignment(card.id, label.id);
    if (dup) {
      throw new ApiError(409, ERROR_CODES.CONFLICT, 'Label already attached to this card');
    }

    await db.transaction(async (tx) => {
      await this.cardRepository.attachLabel(tx, card.id, label.id);

      await insertCardActivity(tx, {
        type: 'card.updated.label.added',
        cardId: card.id,
        createdBy: userId,
        labelId: label.id,
      });
    });

    const refreshed = await this.cardRepository.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!refreshed) {
      throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');
    }
    return refreshed;
  }

  async detachLabel(userId: string, workspaceId: number, cardPublicId: string, labelPublicId: string) {
    const card = await this.cardRepository.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!card) {
      throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');
    }

    const labelRepo = new LabelRepository();
    const label = await labelRepo.findByPublicOnBoard(labelPublicId, card.list.board.id);
    if (!label) {
      throw new ApiError(404, ERROR_CODES.LABEL_NOT_FOUND, 'Label not found on this board');
    }

    const link = await this.cardRepository.findLabelAssignment(card.id, label.id);
    if (!link) {
      throw new ApiError(404, ERROR_CODES.NOT_FOUND, 'Label is not attached to this card');
    }

    return db.transaction(async (tx) => {
      await this.cardRepository.detachLabel(tx, card.id, label.id);

      await insertCardActivity(tx, {
        type: 'card.updated.label.removed',
        cardId: card.id,
        createdBy: userId,
        labelId: label.id,
      });
    });
  }

  async addMember(
    userId: string,
    workspaceId: number,
    cardPublicId: string,
    body: { workspaceMemberId: unknown },
  ) {
    const memberId = parseWorkspaceMemberId(body?.workspaceMemberId);
    if (memberId === null) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'workspaceMemberId is required');
    }

    const members = await workspaceService.getMembers(workspaceId);
    const isMember = members.some(
      (m: { id?: number; workspaceMemberId?: number }) =>
        m.id === memberId || m.workspaceMemberId === memberId,
    );
    if (!isMember) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'Invalid workspace member');
    }

    const card = await this.cardRepository.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!card) {
      throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');
    }

    const existing = await this.cardRepository.findMemberAssignment(card.id, memberId);
    if (existing) {
      throw new ApiError(409, ERROR_CODES.CONFLICT, 'Member already assigned to this card');
    }

    return db.transaction(async (tx) => {
      await this.cardRepository.attachMember(tx, card.id, memberId);

      await insertCardActivity(tx, {
        type: 'card.updated.member.added',
        cardId: card.id,
        createdBy: userId,
        workspaceMemberId: memberId,
      });
    });
  }

  async removeMember(
    userId: string,
    workspaceId: number,
    cardPublicId: string,
    memberPublicOrNumeric: string,
  ) {
    const memberId = parseWorkspaceMemberId(memberPublicOrNumeric);
    if (memberId === null) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'Invalid member id');
    }

    const card = await this.cardRepository.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!card) {
      throw new ApiError(404, ERROR_CODES.CARD_NOT_FOUND, 'Card not found');
    }

    const existing = await this.cardRepository.findMemberAssignment(card.id, memberId);
    if (!existing) {
      throw new ApiError(404, ERROR_CODES.MEMBER_NOT_FOUND, 'Member is not assigned to this card');
    }

    return db.transaction(async (tx) => {
      await this.cardRepository.detachMember(tx, card.id, memberId);

      await insertCardActivity(tx, {
        type: 'card.updated.member.removed',
        cardId: card.id,
        createdBy: userId,
        workspaceMemberId: memberId,
      });
    });
  }
}
