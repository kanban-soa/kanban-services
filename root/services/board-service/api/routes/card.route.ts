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



cardRoutes.patch('/:cardId', moveCard);



cardRoutes.post('/:cardId/members', addCardMember);
cardRoutes.delete('/:cardId/members/:memberId', removeCardMember);
