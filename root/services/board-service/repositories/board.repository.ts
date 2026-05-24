import { db } from '../config/database';
import { boards, lists, cards, labels } from '../schema';
import { generatePublicId } from '../shared/utils/public-id';
import { slugify } from '../shared/utils/slugify';
import { and, eq, isNull, or, type SQL } from 'drizzle-orm';

// Frontend URLs sometimes carry the numeric `id`, sometimes the `publicId`.
// Match either column so both forms resolve to the same board.
function boardIdMatch(boardId: string): SQL {
  const asNumber = Number(boardId);
  if (Number.isInteger(asNumber) && asNumber > 0 && String(asNumber) === boardId) {
    return or(eq(boards.publicId, boardId), eq(boards.id, asNumber)) as SQL;
  }
  return eq(boards.publicId, boardId);
}

export class BoardRepository {
  async create(data: { name: string; description?: string; visibility: any; type: any; workspaceId: number; createdBy: string }) {
    const slug = slugify(data.name);
    const publicId = generatePublicId();
    const [newBoard] = await db
      .insert(boards)
      .values({
        ...data,
        publicId,
        slug,
      })
      .returning();
    return newBoard;
  }

  async findById(boardId: string, workspaceId: number) {
    return db.query.boards.findFirst({
      where: and(
        boardIdMatch(boardId),
        eq(boards.workspaceId, workspaceId),
        isNull(boards.deletedAt)
      ),
    });
  }

  async findAllByWorkspace(workspaceId: number) {
    return db.query.boards.findMany({
      where: and(
        eq(boards.workspaceId, workspaceId),
        isNull(boards.deletedAt)
      ),
    });
  }

  async update(boardId: string, data: any) {
    const [updatedBoard] = await db
      .update(boards)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          boardIdMatch(boardId),
          isNull(boards.deletedAt)
        )
      )
      .returning();
    return updatedBoard;
  }

  async softDelete(boardId: string, userId: string, workspaceId: number) {
    return db.transaction(async (tx) => {
      const [deletedBoard] = await tx
        .update(boards)
        .set({ deletedAt: new Date(), deletedBy: userId })
        .where(
          and(
            boardIdMatch(boardId),
            eq(boards.workspaceId, workspaceId),
            isNull(boards.deletedAt)
          )
        )
        .returning();

      if (deletedBoard) {
        // Find all lists for this board
        const listsToDelete = await tx.query.lists.findMany({
          where: eq(lists.boardId, deletedBoard.id)
        });
        const listIds = listsToDelete.map(l => l.id);

        if (listIds.length > 0) {
          // Delete those lists
          await tx.update(lists)
            .set({ deletedAt: new Date(), deletedBy: userId })
            .where(and(eq(lists.boardId, deletedBoard.id), isNull(lists.deletedAt)));

          // Delete cards inside those lists
          // Actually, cards have listId. Let's delete cards by listId.
          for (const lid of listIds) {
            await tx.update(cards)
              .set({ deletedAt: new Date(), deletedBy: userId })
              .where(and(eq(cards.listId, lid), isNull(cards.deletedAt)));
          }
        }
      }

      return deletedBoard;
    });
  }

  async findBoardWithDetail(boardId: string) {
    return db.query.boards.findFirst({
      where: and(
        boardIdMatch(boardId),
        isNull(boards.deletedAt)
      ),
      with: {
        allLists: {
          where: isNull(lists.deletedAt),
          orderBy: (lists, { asc }) => [asc(lists.index)],
          with: {
            cards: {
              where: isNull(cards.deletedAt),
              orderBy: (cards, { asc }) => [asc(cards.index)],
              with: {
                labels: {
                  with: {
                    label: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
