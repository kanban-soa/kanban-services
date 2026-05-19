import { Request, Response, NextFunction } from 'express';
import { LabelService } from '@/board-service/services/label.service';
import { sendSuccess } from '@/board-service/shared/utils/response';

const labelService = new LabelService();

export const getBoardLabels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = Number(req.headers['x-workspace-id']);
    const boardId = req.params.boardId as string;
    const labels = await labelService.getLabels(userId, workspaceId, boardId);
    sendSuccess(res, labels, 'Labels retrieved successfully');
  } catch (e) {
    next(e);
  }
};

export const createBoardLabel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = Number(req.headers['x-workspace-id']);
    const boardId = req.params.boardId as string;
    const created = await labelService.createLabel(userId, workspaceId, boardId, req.body);
    sendSuccess(res, created, 'Label created successfully', 201);
  } catch (e) {
    next(e);
  }
};
