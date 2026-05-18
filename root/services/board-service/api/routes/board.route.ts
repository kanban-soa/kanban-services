import { Router } from 'express';
import {
  getBoards,
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
  getBoardDetail
} from '../controllers/board.controller';

const router = Router();

router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:boardId', getBoardById);
router.patch('/:boardId', updateBoard);
router.delete('/:boardId', deleteBoard);
router.get('/:boardId/detail', getBoardDetail);

export const boardRoutes = router;
