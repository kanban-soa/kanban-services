import { db } from '../config';
import { boards } from '../schema';
import ApiError from '../shared/errors/apiError';

const getBoards = async () => {
  try {
    const result = await db.select().from(boards);
    if (!result) {
      throw new ApiError(404, 'No boards found');
    }
    return result;
  } catch (error) {
    // Log the error and re-throw it to be caught by the error middleware
    console.error('Error in getBoards service:', error);
    throw error;
  }
};

export const boardService = {
  getBoards,
};
