import { Router } from 'express';
import {
  createBoardInWorkspace,
  listBoardsInWorkspace,
  getBoardInWorkspace,
  updateBoardInWorkspace,
  deleteBoardInWorkspace,
  listBoardListsInWorkspace,
} from '../controllers/workspace-board.controller';

const router = Router({ mergeParams: true });

router.post('/', createBoardInWorkspace);
router.get('/', listBoardsInWorkspace);
router.get('/:boardId', getBoardInWorkspace);
router.patch('/:boardId', updateBoardInWorkspace);
router.delete('/:boardId', deleteBoardInWorkspace);
router.get('/:boardId/lists', listBoardListsInWorkspace);

export const workspaceBoardRoutes = router;
