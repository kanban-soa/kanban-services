import { Router } from 'express';
import { searchInWorkspace } from '../controllers/search.controller';

const router = Router({ mergeParams: true });

router.get('/', searchInWorkspace);

export const searchRoutes = router;
