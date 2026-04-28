import { Request, Response, NextFunction } from 'express';
import { boardService } from '@/board-service/services';
import { success } from '@/board-service/shared/utils/response.util';
import ApiError from '@/board-service/shared/errors/apiError';

const getBoards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boards = await boardService.getBoards();
    return success(res, 'Boards retrieved successfully', boards);
  } catch (error) {
    next(error);
  }
};

export const boardController = {
  getBoards,
};
