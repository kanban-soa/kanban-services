import { NextFunction, Request, Response, Router } from 'express';
import {
  createBoard,
  deleteBoardsByWorkspaceId,
  getBoardById,
  getBoardsByWorkspaceId,
  updateBoard,
} from '../controllers/board.controller';
import { validate } from '../../middlewares/validate';
import { createBoardSchema, updateBoardSchema } from '../dto/board.dto';

const router = Router();
const validateWorkspaceIdQuery = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const workspaceId = req.query.workspaceId;
  if (typeof workspaceId !== 'string' || Number.isNaN(Number(workspaceId))) {
    return res
      .status(400)
      .json({ message: 'Missing or invalid workspaceId query parameter' });
  }
  return next();
};

router.post('/', validate(createBoardSchema), createBoard);
router.get('/', validateWorkspaceIdQuery, getBoardsByWorkspaceId);
router.delete('/', validateWorkspaceIdQuery, deleteBoardsByWorkspaceId);
router.get('/:boardId', getBoardById);
router.patch('/:boardId', validate(updateBoardSchema), updateBoard);

export const boardRoutes = router;
