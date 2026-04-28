import { Router } from 'express';
import boardRoutes from './board.route';
// Import other routes as they are created
// import listRoutes from './list.route';
// import cardRoutes from './card.route';

const router = Router();

router.use('/boards', boardRoutes);
// router.use('/lists', listRoutes);
// router.use('/cards', cardRoutes);

export const routes = router;