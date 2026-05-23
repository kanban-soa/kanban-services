import { NextFunction, Request, Response } from 'express';
import { SearchService, type SearchScope } from '@/board-service/services/search.service';
import { sendSuccess } from '@/board-service/shared/utils/response';

const searchService = new SearchService();

const VALID_SCOPES: SearchScope[] = ['all', 'boards', 'lists', 'cards'];

export const searchInWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const rawScope = typeof req.query.scope === 'string' ? req.query.scope : 'all';
    const scope = (VALID_SCOPES as string[]).includes(rawScope)
      ? (rawScope as SearchScope)
      : 'all';
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;

    const result = await searchService.searchInWorkspace(workspaceId, query, {
      scope,
      limit,
      offset,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
