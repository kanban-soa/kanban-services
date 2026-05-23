import { Router } from 'express';
import {
  createBoard,
  updateBoard,
  deleteBoard,
  getBoardDetail,
  getAllBoards,
} from '../controllers/board.controller';

import { createListOnBoard } from '../controllers/list.controller';

const router = Router({ mergeParams: true });

router.post("/all", getAllBoards);
router.get('/:boardId', getBoardDetail);
router.post('/', createBoard);
router.patch('/:boardId/', updateBoard);
router.delete('/:boardId/', deleteBoard);
router.post('/:boardId/lists', createListOnBoard);

export const boardRoutes = router;
