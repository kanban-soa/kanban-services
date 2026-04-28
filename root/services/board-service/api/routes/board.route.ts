import { Router } from 'express';
import { boardController } from '../controllers';

const router = Router();

router.get('/', boardController.getBoards);

export default router;