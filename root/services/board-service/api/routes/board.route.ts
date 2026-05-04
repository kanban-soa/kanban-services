import { Router } from 'express';
import {
  createBoard,
  getBoardById,
  updateBoard,
} from '../controllers/board.controller';
import { validate } from '../../middlewares/validate';
import { createBoardSchema, updateBoardSchema } from '../dto/board.dto';

const router = Router();

router.post('/', validate(createBoardSchema), createBoard);
router.get('/:boardId', getBoardById);
router.patch('/:boardId', validate(updateBoardSchema), updateBoard);

export const boardRoutes = router;

