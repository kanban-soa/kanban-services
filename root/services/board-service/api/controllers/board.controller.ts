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

