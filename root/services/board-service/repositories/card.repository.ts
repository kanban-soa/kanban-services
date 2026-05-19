import { db, type DbOrTx } from '@/board-service/config/database';
import { cards, cardsToLabels, cardToWorkspaceMembers, lists } from '@/board-service/schema';
import { generatePublicId } from '@/board-service/shared/utils/public-id';
import { and, asc, eq, isNull, max } from 'drizzle-orm';

export class CardRepository {
  async findByPublicIdWithContext(cardPublicId: string, workspaceId: number) {
    const row = await db.query.cards.findFirst({
      where: and(eq(cards.publicId, cardPublicId), isNull(cards.deletedAt)),
      with: {
        list: {
          with: { board: true },
        },
      },
    });
    if (!row?.list?.board || row.list.board.deletedAt) return null;
    if (row.list.board.workspaceId !== workspaceId) return null;
    return row;
  }

  async findManyByListPublicId(listPublicId: string, workspaceId: number) {
    const listRow = await db.query.lists.findFirst({
      where: and(eq(lists.publicId, listPublicId), isNull(lists.deletedAt)),
      with: { board: true },
    });
    if (!listRow?.board || listRow.board.deletedAt) return null;
    if (listRow.board.workspaceId !== workspaceId) return null;

    const rows = await db.query.cards.findMany({
      where: and(eq(cards.listId, listRow.id), isNull(cards.deletedAt)),
      orderBy: [asc(cards.index)],
    });
    return { list: listRow, cards: rows };
  }

  async nextIndex(tx: DbOrTx, listInternalId: number): Promise<number> {
    const [row] = await tx
      .select({ value: max(cards.index) })
      .from(cards)
      .where(and(eq(cards.listId, listInternalId), isNull(cards.deletedAt)));
    const current = row?.value;
    return (typeof current === 'number' ? current : -1) + 1;
  }

  async create(
    tx: DbOrTx,
    input: {
      title: string;
      description?: string | null;
      listInternalId: number;
      createdBy: string;
    },
  ) {
    const index = await this.nextIndex(tx, input.listInternalId);
    const [created] = await tx
      .insert(cards)
      .values({
        publicId: generatePublicId(),
        title: input.title,
        description: input.description ?? null,
        index,
        listId: input.listInternalId,
        createdBy: input.createdBy,
      })
      .returning();
    return created;
  }

  async update(
    cardPublicId: string,
    workspaceId: number,
    data: { title?: string; description?: string | null },
  ) {
    const existing = await this.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!existing) return null;

    const [updated] = await db
      .update(cards)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(cards.publicId, cardPublicId), isNull(cards.deletedAt)))
      .returning();
    return updated ?? null;
  }

  async softDelete(cardPublicId: string, workspaceId: number, userId: string) {
    const existing = await this.findByPublicIdWithContext(cardPublicId, workspaceId);
    if (!existing) return null;

    const [updated] = await db
      .update(cards)
      .set({ deletedAt: new Date(), deletedBy: userId })
      .where(and(eq(cards.publicId, cardPublicId), isNull(cards.deletedAt)))
      .returning();
    return updated ?? null;
  }

  async reorderListCards(listPublicId: string, workspaceId: number, cardPublicIds: string[]) {
    return db.transaction(async (tx) => {
      const listRow = await tx.query.lists.findFirst({
        where: and(eq(lists.publicId, listPublicId), isNull(lists.deletedAt)),
        with: { board: true },
      });
      if (!listRow?.board || listRow.board.deletedAt) {
        return { ok: false as const, reason: 'LIST_NOT_FOUND' as const };
      }
      if (listRow.board.workspaceId !== workspaceId) {
        return { ok: false as const, reason: 'LIST_NOT_FOUND' as const };
      }

      const active = await tx.query.cards.findMany({
        where: and(eq(cards.listId, listRow.id), isNull(cards.deletedAt)),
      });

      if (cardPublicIds.length !== active.length) {
        return { ok: false as const, reason: 'INVALID_REORDER_SET' as const };
      }

      const idSet = new Set(active.map((c) => c.publicId));
      for (const id of cardPublicIds) {
        if (!idSet.has(id)) {
          return { ok: false as const, reason: 'INVALID_REORDER_SET' as const };
        }
      }

      for (let i = 0; i < cardPublicIds.length; i++) {
        await tx
          .update(cards)
          .set({ index: i, updatedAt: new Date() })
          .where(
            and(
              eq(cards.listId, listRow.id),
              eq(cards.publicId, cardPublicIds[i]!),
              isNull(cards.deletedAt),
            ),
          );
      }

      return { ok: true as const };
    });
  }

  async getOrderedCardsInList(tx: DbOrTx, listInternalId: number) {
    return tx.query.cards.findMany({
      where: and(eq(cards.listId, listInternalId), isNull(cards.deletedAt)),
      orderBy: [asc(cards.index)],
    });
  }

  async setCardIndex(tx: DbOrTx, cardInternalId: number, index: number) {
    await tx
      .update(cards)
      .set({ index, updatedAt: new Date() })
      .where(and(eq(cards.id, cardInternalId), isNull(cards.deletedAt)));
  }

  async setCardListAndIndex(
    tx: DbOrTx,
    cardInternalId: number,
    listInternalId: number,
    index: number,
  ) {
    await tx
      .update(cards)
      .set({ listId: listInternalId, index, updatedAt: new Date() })
      .where(and(eq(cards.id, cardInternalId), isNull(cards.deletedAt)));
  }

  async findLabelAssignment(cardInternalId: number, labelInternalId: number) {
    const [row] = await db
      .select()
      .from(cardsToLabels)
      .where(
        and(eq(cardsToLabels.cardId, cardInternalId), eq(cardsToLabels.labelId, labelInternalId)),
      );
    return row ?? null;
  }

  async attachLabel(tx: DbOrTx, cardInternalId: number, labelInternalId: number) {
    await tx.insert(cardsToLabels).values({ cardId: cardInternalId, labelId: labelInternalId });
  }

  async detachLabel(tx: DbOrTx, cardInternalId: number, labelInternalId: number) {
    await tx
      .delete(cardsToLabels)
      .where(
        and(eq(cardsToLabels.cardId, cardInternalId), eq(cardsToLabels.labelId, labelInternalId)),
      );
  }

  async findMemberAssignment(cardInternalId: number, workspaceMemberId: number) {
    const [row] = await db
      .select()
      .from(cardToWorkspaceMembers)
      .where(
        and(
          eq(cardToWorkspaceMembers.cardId, cardInternalId),
          eq(cardToWorkspaceMembers.workspaceMemberId, workspaceMemberId),
        ),
      );
    return row ?? null;
  }

  async attachMember(tx: DbOrTx, cardInternalId: number, workspaceMemberId: number) {
    await tx.insert(cardToWorkspaceMembers).values({ cardId: cardInternalId, workspaceMemberId });
  }

  async detachMember(tx: DbOrTx, cardInternalId: number, workspaceMemberId: number) {
    await tx
      .delete(cardToWorkspaceMembers)
      .where(
        and(
          eq(cardToWorkspaceMembers.cardId, cardInternalId),
          eq(cardToWorkspaceMembers.workspaceMemberId, workspaceMemberId),
        ),
      );
  }
}
