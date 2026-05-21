import { Request, Response, NextFunction } from 'express';
import { CardService } from '@/board-service/services/card.service';
import { sendSuccess } from '@/board-service/shared/utils/response';

const cardService = new CardService();

export const getCardsByList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = Number(req.params.workspaceId as string);
    const listId = req.params.listId as string;
    const rows = await cardService.getCards(userId, workspaceId, listId);
    sendSuccess(res, rows, 'Cards retrieved successfully');
  } catch (e) {
    next(e);
  }
};

export const createCardOnList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const listId = req.params.listId as string;
    const created = await cardService.createCard(userId, listId, req.body);
    sendSuccess(res, created, 'Card created successfully', 201);
  } catch (e) {
    next(e);
  }
};

export const reorderListCards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = Number(req.params.workspaceId as string);
    const listId = req.params.listId as string;
    await cardService.reorderCards( listId, req.body.cardIds);
    sendSuccess(res, null, 'Cards reordered successfully');
  } catch (e) {
    next(e);
  }
};

export const getCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const cardId = req.params.cardId as string;
    const card = await cardService.getCardDetails(userId, cardId);
    sendSuccess(res, card, 'Card retrieved successfully');
  } catch (e) {
    next(e);
  }
};

export const updateCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const cardId = req.params.cardId as string;
    const updated = await cardService.updateCard(userId, cardId, req.body);
    sendSuccess(res, updated, 'Card updated successfully');
  } catch (e) {
    next(e);
  }
};

export const deleteCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const workspaceId = Number(req.params.workspaceId as string);
    const cardId = req.params.cardId as string;
    await cardService.deleteCard(userId, cardId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

export const moveCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const cardId = req.params.cardId as string;
    const card = await cardService.moveCard(userId, cardId, req.body);
    sendSuccess(res, card, 'Card moved successfully');
  } catch (e) {
    next(e);
  }
};

export const patchDueDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const cardId = req.params.cardId as string;
    const row = await cardService.patchDueDate(userId, cardId, req.body);
    sendSuccess(res, row, 'Due date updated successfully');
  } catch (e) {
    next(e);
  }
};

export const deleteDueDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const cardId = req.params.cardId as string;
    const row = await cardService.deleteDueDate(userId, cardId);
    sendSuccess(res, row, 'Due date removed successfully');
  } catch (e) {
    next(e);
  }
};

export const attachLabelToCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const cardId = req.params.cardId as string;
    const card = await cardService.attachLabel(userId, cardId, req.body);
    sendSuccess(res, 'Label attached successfully');
  } catch (e) {
    next(e);
  }
};

export const detachLabelFromCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const cardId = req.params.cardId as string;
    const labelId = req.params.labelId as string;
    await cardService.detachLabel(userId, cardId, labelId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

export const addCardMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.headers[
      'x-user-id'
    ] as string;

    const cardPublicId =
      req.params.cardId as string;

    const body = req.body as {
      workspaceMemberPublicId: string;
    };

    await cardService.addMember(
      userId,
      cardPublicId,
      body,
    );

    return sendSuccess(
      res,
      null,
      'Member assigned successfully',
      201,
    );
  } catch (error) {
    return next(error);
  }
};

export const removeCardMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.headers[
      'x-user-id'
    ] as string;

    const cardPublicId =
      req.params.cardId as string;

    const workspaceMemberPublicId =
      req.params.memberId as string;

    await cardService.removeMember(
      userId,
      cardPublicId,
      workspaceMemberPublicId,
    );

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
