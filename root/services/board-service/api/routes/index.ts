import { Router } from 'express';
import { boardRoutes } from './board.route';
import { labelRoutes } from './label.route';
import { listRoutes } from './list.route';
import { cardRoutes } from './card.route';

const router = Router({ mergeParams: true });


router.use('/lists', listRoutes);

router.use('/cards', cardRoutes);

router.use('/:boardId/labels', labelRoutes);

router.use('/', boardRoutes);

export default router;
