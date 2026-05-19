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

export const cardRoutes = Router();

cardRoutes.patch('/:cardId/move', moveCard);
cardRoutes.patch('/:cardId/due-date', patchDueDate);
cardRoutes.delete('/:cardId/due-date', deleteDueDate);
cardRoutes.post('/:cardId/labels', attachLabelToCard);
cardRoutes.delete('/:cardId/labels/:labelId', detachLabelFromCard);
cardRoutes.post('/:cardId/members', addCardMember);
cardRoutes.delete('/:cardId/members/:memberId', removeCardMember);
cardRoutes.get('/:cardId', getCard);
cardRoutes.patch('/:cardId', updateCard);
cardRoutes.delete('/:cardId', deleteCard);
