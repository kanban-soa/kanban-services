import { Router } from 'express';
import { boardRoutes } from './board.route';
import { labelRoutes } from './label.route';
import { listRoutes } from './list.route';
import { cardRoutes } from './card.route';

const router = Router({ mergeParams: true });

router.use('/workspaces/:workspaceId/boards', boardRoutes);

router.use('/lists', listRoutes);

router.use('/cards', cardRoutes);

router.use('/:boardId/labels', labelRoutes);

export default router;
