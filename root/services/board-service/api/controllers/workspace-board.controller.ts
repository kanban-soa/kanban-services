import { Request, Response, NextFunction } from 'express';
import { BoardService } from '../../services/board.service';
import { ListService } from '../../services/list.service';
import { ActivityBoardEmitter } from '../../shared/board-activity.emitter';
import { workspaceService } from '../../shared/workspace.client';
import { sendSuccess } from '../../shared/utils/response';
import { BoardMapper } from '../mapper/board.mapper';

const boardService = new BoardService(new ActivityBoardEmitter());
const listService = new ListService();

async function resolveWorkspaceId(req: Request): Promise<number> {
  const raw = req.params.workspaceId as string;
  const asNumber = Number(raw);
  if (raw && Number.isInteger(asNumber) && asNumber > 0 && String(asNumber) === raw) {
    return asNumber;
  }
  return workspaceService.resolveIdByPublicId(raw);
}

function normalizeBoardPayload(body: any) {
  if (!body || typeof body !== 'object') return body;
  if (body.name == null && typeof body.title === 'string') {
    return { ...body, name: body.title };
  }
  return body;
}

export const createBoardInWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = await resolveWorkspaceId(req);
    const payload = normalizeBoardPayload(req.body);
    const newBoard = await boardService.createBoard(userId, workspaceId, payload);
    sendSuccess(res, newBoard, 'Board created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const listBoardsInWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = await resolveWorkspaceId(req);
    const boards = await boardService.getAllBoards(userId, workspaceId);
    sendSuccess(res, boards, 'Boards retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getBoardInWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const boardId = req.params.boardId as string;
    const board = await boardService.getBoardDetail(userId, boardId);
    sendSuccess(res, BoardMapper.toDetailDto(board), 'Board detail retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateBoardInWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const boardId = req.params.boardId as string;
    const payload = normalizeBoardPayload(req.body);
    const updatedBoard = await boardService.updateBoard(userId, boardId, payload);
    sendSuccess(res, updatedBoard, 'Board updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteBoardInWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const boardId = req.params.boardId as string;
    const workspaceId = await resolveWorkspaceId(req);
    await boardService.deleteBoard(userId, boardId, workspaceId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const listBoardListsInWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const boardId = req.params.boardId as string;
    const workspaceId = await resolveWorkspaceId(req);
    const lists = await listService.getLists(userId, workspaceId, boardId);
    sendSuccess(res, lists, 'Lists retrieved successfully');
  } catch (error) {
    next(error);
  }
};
