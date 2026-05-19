import { Router } from 'express';
import { updateList, deleteList } from '../controllers/list.controller';

export const listRoutes = Router();
// Use all routes
listRoutes.patch('/:listId', updateList);
listRoutes.delete('/:listId', deleteList);
