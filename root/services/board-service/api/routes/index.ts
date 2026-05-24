import { Router } from 'express';
import { boardRoutes } from './board.route';
import { labelRoutes } from './label.route';
import { listRoutes } from './list.route';
import { cardRoutes } from './card.route';
import { workspaceBoardRoutes } from './workspace-board.route';

const router = Router({ mergeParams: true });


router.use('/lists', listRoutes);

router.use('/cards', cardRoutes);

router.use('/workspaces/:workspaceId/boards', workspaceBoardRoutes);

router.use('/:boardId/labels', labelRoutes);

router.use('/', boardRoutes);

export default router;
