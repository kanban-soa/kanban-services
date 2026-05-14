import { db } from '../config/database';
import { boards } from '../schema';
import { generatePublicId } from '../shared/utils/public-id';
import { slugify } from '../shared/utils/slugify';
import { and, eq, isNull } from 'drizzle-orm';

export class BoardRepository {
  async create(data: { name: string; workspaceId: string }) {
    const slug = slugify(data.name);
    const publicId = generatePublicId();
    const [newBoard] = await db
      .insert(boards)
      .values({
        ...data,
        workspaceId: Number(data.workspaceId),
        publicId,
        slug,
      })
      .returning();
    return newBoard;
  }

  async findById(boardId: string) {
    return db.query.boards.findFirst({
      where: and(eq(boards.publicId, boardId), isNull(boards.deletedAt)),
    });
  }

  async findByWorkspaceId(workspaceId: string) {
    return db.query.boards.findMany({
      where: and(
        eq(boards.workspaceId, Number(workspaceId)),
        isNull(boards.deletedAt),
      ),
    });
  }

  async update(
    boardId: string,
    data: { name?: string; description?: string },
  ) {
    const [updatedBoard] = await db
      .update(boards)
      .set(data)
      .where(eq(boards.publicId, boardId))
      .returning();
    return updatedBoard;
  }

  async softDeleteByWorkspaceId(workspaceId: string, deletedBy: string) {
    return db
      .update(boards)
      .set({
        deletedAt: new Date(),
        deletedBy,
      })
      .where(
        and(eq(boards.workspaceId, Number(workspaceId)), isNull(boards.deletedAt)),
      )
      .returning();
  }
}
