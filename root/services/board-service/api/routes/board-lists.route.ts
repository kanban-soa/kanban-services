import { Router } from 'express';
import { getListsByBoard, createListOnBoard, reorderBoardLists } from '../controllers/list.controller';

export const boardListsRoutes = Router({ mergeParams: true });

boardListsRoutes.get('/', getListsByBoard);
boardListsRoutes.post('/', createListOnBoard); // Using this 
boardListsRoutes.patch('/reorder', reorderBoardLists);
