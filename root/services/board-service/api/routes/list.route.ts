import { Router } from 'express';
import { updateList, deleteList } from '../controllers/list.controller';
import { createCardOnList  } from '../controllers/card.controller';

export const listRoutes = Router({ mergeParams: true });


listRoutes.patch('/:listId', updateList);
listRoutes.delete('/:listId', deleteList);
listRoutes.post('/:listId/cards', createCardOnList);
