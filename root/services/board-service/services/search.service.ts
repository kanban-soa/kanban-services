import { SearchRepository } from '@/board-service/repositories/search.repository';
import { ApiError, ERROR_CODES } from '@/board-service/shared/errors';

export type SearchScope = 'all' | 'boards' | 'lists' | 'cards';

export interface SearchOptions {
  scope?: SearchScope;
  limit?: number;
  offset?: number;
}

export class SearchService {
  private readonly repo = new SearchRepository();

  async searchInWorkspace(
    workspaceId: number,
    query: string,
    opts: SearchOptions = {},
  ) {
    const trimmed = (query ?? '').trim();
    if (!trimmed) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, "Query 'q' is required");
    }
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) {
      throw new ApiError(400, ERROR_CODES.BAD_REQUEST, 'Invalid workspaceId');
    }

    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
    const offset = Math.max(opts.offset ?? 0, 0);
    const scope: SearchScope = opts.scope ?? 'all';
    const page = { limit, offset };

    const wantBoards = scope === 'all' || scope === 'boards';
    const wantLists = scope === 'all' || scope === 'lists';
    const wantCards = scope === 'all' || scope === 'cards';

    const [boardsRows, listsRows, cardsRows] = await Promise.all([
      wantBoards ? this.repo.searchBoards(workspaceId, trimmed, page) : Promise.resolve([]),
      wantLists ? this.repo.searchLists(workspaceId, trimmed, page) : Promise.resolve([]),
      wantCards ? this.repo.searchCards(workspaceId, trimmed, page) : Promise.resolve([]),
    ]);

    return {
      query: trimmed,
      scope,
      boards: boardsRows,
      lists: listsRows,
      cards: cardsRows,
    };
  }
}
