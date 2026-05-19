import { db, type DbOrTx } from '@/board-service/config/database';
import { boards, labels } from '@/board-service/schema';
import { generatePublicId } from '@/board-service/shared/utils/public-id';
import { and, asc, eq, isNull } from 'drizzle-orm';

export class LabelRepository {
  async findBoardInternal(boardPublicId: string, workspaceId: number) {
    return db.query.boards.findFirst({
      where: and(
        eq(boards.publicId, boardPublicId),
        eq(boards.workspaceId, workspaceId),
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
}
