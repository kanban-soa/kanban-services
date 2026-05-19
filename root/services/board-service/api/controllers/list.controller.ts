import { Request, Response, NextFunction } from 'express';
import { ListService } from '@/board-service/services/list.service';
import { sendSuccess } from '@/board-service/shared/utils/response';

const listService = new ListService();

export const getListsByBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = Number(req.headers['x-workspace-id']);
    const boardId = req.params.boardId as string;
    const lists = await listService.getLists(userId, workspaceId, boardId);
    sendSuccess(res, lists, 'Lists retrieved successfully');
  } catch (e) {
    next(e);
  }
};

export const createListOnBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = Number(req.headers['x-workspace-id']);
    const boardId = req.params.boardId as string;
    const created = await listService.createList(userId, workspaceId, boardId, req.body);
    sendSuccess(res, created, 'List created successfully', 201);
  } catch (e) {
    next(e);
  }
};

export const reorderBoardLists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = Number(req.headers['x-workspace-id']);
    const boardId = req.params.boardId as string;
    await listService.reorderLists(workspaceId, boardId, req.body.listIds);
    sendSuccess(res, null, 'Lists reordered successfully');
  } catch (e) {
    next(e);
  }
};

export const updateList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = Number(req.headers['x-workspace-id']);
    const listId = req.params.listId as string;
    const updated = await listService.updateList(userId, workspaceId, listId, req.body);
    sendSuccess(res, updated, 'List updated successfully');
  } catch (e) {
    next(e);
  }
};

export const deleteList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = Number(req.headers['x-workspace-id']);
    const listId = req.params.listId as string;
    await listService.deleteList(userId, workspaceId, listId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
