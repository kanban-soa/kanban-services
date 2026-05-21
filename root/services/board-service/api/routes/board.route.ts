import { Router } from 'express';
import {
  createBoard,
  updateBoard,
  deleteBoard,
  getBoardDetail,
} from '../controllers/board.controller';

import { createListOnBoard } from '../controllers/list.controller';


const router = Router({ mergeParams: true });


router.get('/:boardId', getBoardDetail);
router.post('/', createBoard);
router.patch('/:boardId/', updateBoard);
router.delete('/:boardId/', deleteBoard);
router.get('/:boardId/lists', createListOnBoard);







export const boardRoutes = router;
