import { Request, Response } from 'express';
import { BoardService } from '../../services/board.service';

const boardService = new BoardService();

export const createBoard = async (req: Request, res: Response) => {
  try {
    const newBoard = await boardService.createBoard(req.body);
    res.status(201).json(newBoard);
  } catch (error) {
    console.error('Error creating board:', error); // Log the actual error
    res.status(500).json({ message: 'Failed to create board' });
  }
};

export const getBoardById = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params;
    if (typeof boardId !== 'string') {
      return res.status(400).json({ message: 'Invalid board ID' });
    }
    const board = await boardService.getBoardById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    res.status(200).json(board);
  } catch (error) {
    console.error('Error fetching board:', error); // Log the actual error
    res.status(500).json({ message: 'Failed to get board' });
  }
};

export const getBoardsByWorkspaceId = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId;
    if (typeof workspaceId !== 'string' || Number.isNaN(Number(workspaceId))) {
      return res
        .status(400)
        .json({ message: 'Missing or invalid workspaceId query parameter' });
    }

    const boards = await boardService.getBoardsByWorkspaceId(workspaceId);
    return res.status(200).json({
      success: true,
      data: boards,
    });
  } catch (error) {
    console.error('Error fetching boards by workspace:', error);
    return res.status(500).json({ message: 'Failed to get boards' });
  }
};

export const updateBoard = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params;
    if (typeof boardId !== 'string') {
      return res.status(400).json({ message: 'Invalid board ID' });
    }
    const updatedBoard = await boardService.updateBoard(
      boardId,
      req.body,
    );
    if (!updatedBoard) {
      return res.status(404).json({ message: 'Board not found' });
    }
    res.status(200).json(updatedBoard);
  } catch (error) {
    console.error('Error updating board:', error); // Log the actual error
    res.status(500).json({ message: 'Failed to update board' });
  }
};

export const deleteBoardsByWorkspaceId = async (
  req: Request,
  res: Response,
) => {
  try {
    const workspaceId = req.query.workspaceId;
    const deletedBy = req.header('x-user-id');

    if (typeof workspaceId !== 'string' || Number.isNaN(Number(workspaceId))) {
      return res
        .status(400)
        .json({ message: 'Missing or invalid workspaceId query parameter' });
    }

    if (!deletedBy) {
      return res.status(400).json({ message: 'Missing x-user-id header' });
    }

    const deletedBoards = await boardService.deleteBoardsByWorkspaceId(
      workspaceId,
      deletedBy,
    );

    return res.status(200).json({
      success: true,
      data: {
        deletedCount: deletedBoards.length,
      },
    });
  } catch (error) {
    console.error('Error deleting boards by workspace:', error);
    return res.status(500).json({ message: 'Failed to delete boards' });
  }
};
