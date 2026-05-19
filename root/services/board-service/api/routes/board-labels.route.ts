import { Router } from 'express';
import { getBoardLabels, createBoardLabel } from '../controllers/label.controller';

export const boardLabelsRoutes = Router({ mergeParams: true });

boardLabelsRoutes.get('/', getBoardLabels);
boardLabelsRoutes.post('/', createBoardLabel);
