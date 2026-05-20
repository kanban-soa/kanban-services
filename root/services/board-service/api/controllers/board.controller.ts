import { Request, Response, NextFunction } from 'express';
import { BoardService } from '../../services/board.service';
import { sendSuccess } from '../../shared/utils/response';

const boardService = new BoardService();


export const createBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = Number(req.params.workspaceId as string);
    
    const newBoard = await boardService.createBoard(userId, workspaceId, req.body);
    sendSuccess(res, newBoard, 'Board created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getBoardById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = Number(req.params.workspaceId as string);
    const boardId = req.params.boardId as string;

    const board = await boardService.getBoardById(userId, workspaceId, boardId);
    sendSuccess(res, board, 'Board retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = Number(req.params.workspaceId as string);
    const boardId = Array.isArray(req.params.boardId) ? req.params.boardId[0]! : req.params.boardId;

    const updatedBoard = await boardService.updateBoard(userId, workspaceId, boardId, req.body);
    sendSuccess(res, updatedBoard, 'Board updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = Number(req.params.workspaceId as string);    
    const boardId = req.params.boardId as string;
    console.log(`Attempting to delete boardId: ${boardId} in workspaceId: ${workspaceId} for userId: ${userId}`);

    await boardService.deleteBoard(userId, workspaceId, boardId);
    res.status(204).send(); // Standard NO CONTENT for deletion
  } catch (error) {
    next(error);
  }
};

export const getBoardDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = Number(req.params.workspaceId as string);
    const boardId = req.params.boardId as string;
    const board = await boardService.getBoardDetail(userId, workspaceId, boardId);
    sendSuccess(res, board, 'Board detail retrieved successfully');
  } catch (error) {
    next(error);
  }

};
