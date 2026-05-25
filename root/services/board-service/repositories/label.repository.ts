import { db, type DbOrTx } from '@/board-service/config/database';
import { boards, labels } from '@/board-service/schema';
import { generatePublicId } from '@/board-service/shared/utils/public-id';
import { dualIdMatch } from '@/board-service/shared/utils/dual-id-match';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { ApiError, ERROR_CODES } from '../shared/errors';

export class LabelRepository {
  async findBoardInternal(boardId: string) {
    return db.query.boards.findFirst({
      where: and(
        dualIdMatch(boards.publicId, boards.id, boardId),
        isNull(boards.deletedAt),
      ),
    });
  }

  async findManyByBoard(boardInternalId: number) {
    return db.query.labels.findMany({
      where: and(eq(labels.boardId, boardInternalId), isNull(labels.deletedAt)),
      orderBy: [asc(labels.name)],
    });
  }

  async findByPublicOnBoard(labelPublicId: string, boardInternalId: number) {
    return db.query.labels.findFirst({
      where: and(
        eq(labels.publicId, labelPublicId),
        eq(labels.boardId, boardInternalId),
        isNull(labels.deletedAt),
      ),
    });
  }

  async update(
    tx: DbOrTx,
    labelInternalId: number,
    input: { name?: string; colourCode?: string | null },
  ) {
    const [updated] = await tx
      .update(labels)
      .set({
        name: input.name,
        colourCode: input.colourCode ?? null,
        updatedAt: new Date()
      })
      .where(eq(labels.id, labelInternalId))
      .returning();
    return updated;
  }

  async create(
    tx: DbOrTx,
    input: {
      name: string;
      colourCode?: string | null;
      boardInternalId: number;
      createdBy: string;
    },
  ) {
    const [created] = await tx
      .insert(labels)
      .values({
        publicId: generatePublicId(),
        name: input.name,
        colourCode: input.colourCode ?? null,
        boardId: input.boardInternalId,
        createdBy: input.createdBy,
      })
      .returning();
    return created;
  }

  async softDelete(userId: string, labelPublicId: string) {
    return db.transaction(async (tx) => {
      const existing = await tx.query.labels.findFirst({
        where: and(eq(labels.publicId, labelPublicId), isNull(labels.deletedAt)),
        with: { board: true },
      });
      if (!existing?.board || existing.board.deletedAt) return null;

      const [deletedLabel] = await tx
        .update(labels)
        .set({ deletedAt: new Date(), deletedBy: userId })
        .where(eq(labels.id, existing.id))
        .returning();
      return deletedLabel ?? null;
    });
  }
}
