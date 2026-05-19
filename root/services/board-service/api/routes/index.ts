import { Router } from 'express';
import { boardRoutes } from './board.route';
import { boardListsRoutes } from './board-lists.route';
import { boardLabelsRoutes } from './board-labels.route';
import { listRoutes } from './list.route';
import { listCardsRoutes } from './list-cards.route';
import { cardRoutes } from './card.route';
import { getBoardMembers } from '../controllers/board.controller';

const router = Router();

router.use('/boards', boardRoutes);
router.use('/boards/:boardId/lists', boardListsRoutes);
router.use('/boards/:boardId/labels', boardLabelsRoutes);
router.get('/boards/:boardId/members', getBoardMembers);

router.use('/lists/:listId/cards', listCardsRoutes);
router.use('/lists', listRoutes);

router.use('/cards', cardRoutes);

export default router;
