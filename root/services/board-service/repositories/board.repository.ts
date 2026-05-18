import { db } from '../config/database';
import { boards, lists, cards } from '../schema';
import { generatePublicId } from '../shared/utils/public-id';
import { slugify } from '../shared/utils/slugify';
import { and, eq, isNull } from 'drizzle-orm';

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
        eq(boards.publicId, boardId),
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

  async update(boardId: string, workspaceId: number, data: any) {
    const [updatedBoard] = await db
      .update(boards)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(boards.publicId, boardId),
          eq(boards.workspaceId, workspaceId),
          isNull(boards.deletedAt)
        )
      )
      .returning();
    return updatedBoard;
  }

  async softDelete(boardId: string, workspaceId: number, userId: string) {
    return db.transaction(async (tx) => {
      const [deletedBoard] = await tx
        .update(boards)
        .set({ deletedAt: new Date(), deletedBy: userId })
        .where(
          and(
            eq(boards.publicId, boardId),
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

  async findBoardWithDetail(boardId: string, workspaceId: number) {
    return db.query.boards.findFirst({
      where: and(
        eq(boards.publicId, boardId),
        eq(boards.workspaceId, workspaceId),
        isNull(boards.deletedAt)
      ),
      with: {
        allLists: {
          where: isNull(lists.deletedAt),
          orderBy: (lists, { asc }) => [asc(lists.index)],
          with: {
            cards: {
              where: isNull(cards.deletedAt),
              orderBy: (cards, { asc }) => [asc(cards.index)]
            }
          }
        }
      }
    });
  }
}
