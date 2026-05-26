import { Router } from 'express';
import {
  addCardMember,
  attachLabelToCard,
  deleteCard,
  deleteDueDate,
  detachLabelFromCard,
  getCard,
  moveCard,
  patchDueDate,
  removeCardMember,
  updateCard,
} from '../controllers/card.controller';

export const cardRoutes = Router({ mergeParams: true });


cardRoutes.get('/:cardId', getCard);
cardRoutes.patch('/:cardId', updateCard);//update title and description
cardRoutes.delete('/:cardId', deleteCard);


cardRoutes.post('/:cardId/labels/', attachLabelToCard);
cardRoutes.delete('/:cardId/labels/:labelId', detachLabelFromCard);

cardRoutes.patch('/:cardId/due-date', patchDueDate);
cardRoutes.delete('/:cardId/due-date', deleteDueDate);


// Move a card to another list (or reorder within the same list)
cardRoutes.patch('/:cardId/move', moveCard);



cardRoutes.post('/:cardId/members', addCardMember);
cardRoutes.delete('/:cardId/members/:memberId', removeCardMember);
