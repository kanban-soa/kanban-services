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
router.patch('/:boardId', updateBoard);
router.delete('/:boardId', deleteBoard);
router.get('/:boardId/detail', getBoardDetail);

router.get('/:boardId', getBoardById); //=> this route not using anymore, but we keep it for backward compatibility

export const boardRoutes = router;
