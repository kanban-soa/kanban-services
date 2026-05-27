import { db, type DbOrTx } from '@/board-service/config/database';
import { boards, cards, lists } from '@/board-service/schema';
import { generatePublicId } from '@/board-service/shared/utils/public-id';
import { dualIdMatch } from '@/board-service/shared/utils/dual-id-match';
import { and, asc, eq, isNull, max } from 'drizzle-orm';

export class ListRepository {
  async findBoardByPublicId(boardIdOrPublicId: string) {
    return db.query.boards.findFirst({
      where: and(
        dualIdMatch(boards.publicId, boards.id, boardIdOrPublicId),
        isNull(boards.deletedAt),
      ),
    });
  }

  async findByPublicIdWithBoard(listIdOrPublicId: string) {
    const row = await db.query.lists.findFirst({
      where: and(
        dualIdMatch(lists.publicId, lists.id, listIdOrPublicId),
        isNull(lists.deletedAt),
      ),
      with: {
        board: true,
      },
    });
    if (!row?.board || row.board.deletedAt) return null;
    return row;
  }

  async findManyByBoardId(boardInternalId: number) {
    return db.query.lists.findMany({
      where: and(eq(lists.boardId, boardInternalId), isNull(lists.deletedAt)),
      orderBy: [asc(lists.index)],
      with: {
        cards: {
          where: isNull(cards.deletedAt),
          orderBy: [asc(cards.index)],
          with: {
            labels: {
              with: {
                label: true,
              },
            },
          },
        },
      },
    });
  }

  async nextIndex(tx: DbOrTx, boardInternalId: number): Promise<number> {
    const [row] = await tx
      .select({ value: max(lists.index) })
      .from(lists)
      .where(and(eq(lists.boardId, boardInternalId), isNull(lists.deletedAt)));
    const current = row?.value;
    return (typeof current === 'number' ? current : -1) + 1;
  }

  async create(
    tx: DbOrTx,
    input: {
      name: string;
      boardInternalId: number;
      createdBy: string;
    },
  ) {
    const index = await this.nextIndex(tx, input.boardInternalId);
    const [created] = await tx
      .insert(lists)
      .values({
        publicId: generatePublicId(),
        name: input.name,
        index,
        boardId: input.boardInternalId,
        createdBy: input.createdBy,
      })
      .returning();
    return created;
  }

  async updateName(listIdOrPublicId: string, name: string) {
    const existing = await this.findByPublicIdWithBoard(listIdOrPublicId);
    if (!existing) return null;

    const [updated] = await db
      .update(lists)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(lists.id, existing.id), isNull(lists.deletedAt)))
      .returning();
    return updated ?? null;
  }

  async softDelete(listIdOrPublicId: string, userId: string) {
    return db.transaction(async (tx) => {
      const existing = await tx.query.lists.findFirst({
        where: and(
          dualIdMatch(lists.publicId, lists.id, listIdOrPublicId),
          isNull(lists.deletedAt),
        ),
        with: { board: true },
      });
      if (!existing?.board || existing.board.deletedAt) return null;

      const [deletedList] = await tx
        .update(lists)
        .set({ deletedAt: new Date(), deletedBy: userId })
        .where(and(eq(lists.id, existing.id), isNull(lists.deletedAt)))
        .returning();

      if (deletedList) {
        await tx
          .update(cards)
          .set({ deletedAt: new Date(), deletedBy: userId })
          .where(and(eq(cards.listId, deletedList.id), isNull(cards.deletedAt)));
      }

      return deletedList ?? null;
    });
  }

  async reorderBoardLists(
    boardPublicId: string,
    workspaceId: number,
    listPublicIds: string[],
  ) {
    return db.transaction(async (tx) => {
      const board = await tx.query.boards.findFirst({
        where: and(
          eq(boards.publicId, boardPublicId),
          eq(boards.workspaceId, workspaceId),
          isNull(boards.deletedAt),
        ),
      });
      if (!board) return { ok: false as const, reason: 'BOARD_NOT_FOUND' as const };

      const activeLists = await tx.query.lists.findMany({
        where: and(eq(lists.boardId, board.id), isNull(lists.deletedAt)),
      });

      if (listPublicIds.length !== activeLists.length) {
        return { ok: false as const, reason: 'INVALID_REORDER_SET' as const };
      }

      const idSet = new Set(activeLists.map((l) => l.publicId));
      for (const id of listPublicIds) {
        if (!idSet.has(id)) {
          return { ok: false as const, reason: 'INVALID_REORDER_SET' as const };
        }
      }

      for (let i = 0; i < listPublicIds.length; i++) {
        await tx
          .update(lists)
          .set({ index: i, updatedAt: new Date() })
          .where(
            and(
              eq(lists.boardId, board.id),
              eq(lists.publicId, listPublicIds[i]!),
              isNull(lists.deletedAt),
            ),
          );
      }

      return { ok: true as const, boardId: board.id };
    });
  }
}
