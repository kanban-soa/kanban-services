import { Router } from 'express';
import { getCardsByList, createCardOnList, reorderListCards } from '../controllers/card.controller';

export const listCardsRoutes = Router({ mergeParams: true });

listCardsRoutes.get('/', getCardsByList);
listCardsRoutes.post('/', createCardOnList); // Using this
listCardsRoutes.patch('/reorder', reorderListCards);
