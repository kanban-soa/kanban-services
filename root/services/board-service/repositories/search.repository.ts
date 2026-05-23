import { and, eq, ilike, isNull } from 'drizzle-orm';
import { db } from '@/board-service/config/database';
import { boards, lists, cards } from '@/board-service/schema';

export interface SearchPagination {
  limit: number;
  offset: number;
}

export class SearchRepository {
  async searchBoards(workspaceId: number, query: string, page: SearchPagination) {
    const pattern = `%${query}%`;
    return db
      .select({
        id: boards.id,
        publicId: boards.publicId,
        name: boards.name,
        description: boards.description,
        slug: boards.slug,
        workspaceId: boards.workspaceId,
        createdAt: boards.createdAt,
      })
      .from(boards)
      .where(
        and(
          eq(boards.workspaceId, workspaceId),
          isNull(boards.deletedAt),
          ilike(boards.name, pattern),
        ),
      )
      .limit(page.limit)
      .offset(page.offset);
  }

  async searchLists(workspaceId: number, query: string, page: SearchPagination) {
    const pattern = `%${query}%`;
    return db
      .select({
        id: lists.id,
        publicId: lists.publicId,
        name: lists.name,
        boardId: boards.id,
        boardPublicId: boards.publicId,
        boardName: boards.name,
        createdAt: lists.createdAt,
      })
      .from(lists)
      .innerJoin(boards, eq(boards.id, lists.boardId))
      .where(
        and(
          eq(boards.workspaceId, workspaceId),
          isNull(boards.deletedAt),
          isNull(lists.deletedAt),
          ilike(lists.name, pattern),
        ),
      )
      .limit(page.limit)
      .offset(page.offset);
  }

  async searchCards(workspaceId: number, query: string, page: SearchPagination) {
    const pattern = `%${query}%`;
    return db
      .select({
        id: cards.id,
        publicId: cards.publicId,
        title: cards.title,
        description: cards.description,
        listId: lists.id,
        listPublicId: lists.publicId,
        listName: lists.name,
        boardId: boards.id,
        boardPublicId: boards.publicId,
        boardName: boards.name,
        createdAt: cards.createdAt,
      })
      .from(cards)
      .innerJoin(lists, eq(lists.id, cards.listId))
      .innerJoin(boards, eq(boards.id, lists.boardId))
      .where(
        and(
          eq(boards.workspaceId, workspaceId),
          isNull(boards.deletedAt),
          isNull(lists.deletedAt),
          isNull(cards.deletedAt),
          ilike(cards.title, pattern),
        ),
      )
      .limit(page.limit)
      .offset(page.offset);
  }
}
