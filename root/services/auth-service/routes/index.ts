import { Router } from 'express';
import usersRouter from './users.routes';
import sessionsRouter from './sessions.routes';

const router = Router();

router.use('/users', usersRouter);
router.use('/sessions', sessionsRouter);

export default router;
