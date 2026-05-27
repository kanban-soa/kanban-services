import { Request, Response, NextFunction } from 'express';
import { BoardService } from '../../services/board.service';
import { ActivityBoardEmitter } from '../../shared/board-activity.emitter';
import { sendSuccess } from '../../shared/utils/response';
import { BoardMapper } from '../mapper/board.mapper';

const boardService = new BoardService(new ActivityBoardEmitter());


export const createBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const newBoard = await boardService.createBoard(userId, req.body.workspaceId, req.body);
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
    const boardId = Array.isArray(req.params.boardId) ? req.params.boardId[0]! : req.params.boardId;

    const updatedBoard = await boardService.updateBoard(userId, boardId, req.body);
    sendSuccess(res, updatedBoard, 'Board updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const boardId = req.params.boardId as string;

    await boardService.deleteBoard(userId, boardId, req.body.workspaceId);
    res.status(204).send(); // Standard NO CONTENT for deletion
  } catch (error) {
    next(error);
  }
};

export const getBoardDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const boardId = req.params.boardId as string;
    const board = await boardService.getBoardDetail(userId, boardId);
    sendSuccess(res, BoardMapper.toDetailDto(board), 'Board detail retrieved successfully');
  } catch (error) {
    next(error);
  }
};
export const getAllBoards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const boards = await boardService.getAllBoards(userId, req.body.workspaceId);
    res.status(200).json({
      message: 'Boards retrieved successfully',
      data: boards,
    })
  } catch (error) {
    next(error);
  }
};

