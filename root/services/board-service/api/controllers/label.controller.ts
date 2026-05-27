import { Request, Response, NextFunction } from 'express';
import { LabelService } from '@/board-service/services/label.service';
import { sendSuccess } from '@/board-service/shared/utils/response';

const labelService = new LabelService();

export const getBoardLabels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const boardId = req.params.boardId as string;
    const labels = await labelService.getLabels(userId, boardId);
    sendSuccess(res, labels, 'Labels retrieved successfully');
  } catch (e) {
    next(e);
  }
};

export const updateBoardLabels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = req.params.boardId as string;
    const labelId = req.params.labelId as string;
    const updated = await labelService.updateLabel(boardId, labelId, req.body);
    sendSuccess(res, updated, 'Label updated successfully');
  } catch (e) {
    next(e);
  }
}; 

export const deleteLabel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const boardId = req.params.boardId as string;
    const labelId = req.params.labelId as string;
    await labelService.deleteLabel(userId, boardId, labelId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

export const createBoardLabel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const boardId = req.params.boardId as string;
    const created = await labelService.createLabel(userId, boardId, req.body);
    sendSuccess(res, created, 'Label created successfully', 201);
  } catch (e) {
    next(e);
  }
};

