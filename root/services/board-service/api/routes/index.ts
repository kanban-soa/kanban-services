import { Router } from 'express';
import { boardRoutes } from './board.route';

const router = Router();

router.use('/boards', boardRoutes);

export default router;
