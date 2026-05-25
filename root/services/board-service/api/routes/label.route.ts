import { Router } from 'express';
import { getBoardLabels, updateBoardLabels, deleteLabel, createBoardLabel } from '../controllers/label.controller';

export const labelRoutes = Router({ mergeParams: true });

labelRoutes.get('/', getBoardLabels);
labelRoutes.patch('/:labelId', updateBoardLabels);
labelRoutes.delete('/:labelId', deleteLabel);
labelRoutes.post('/', createBoardLabel);

