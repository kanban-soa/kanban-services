import { Request, Response, NextFunction } from 'express';
import { failure } from '../shared/utils/response.util';
import ApiError from '../shared/errors/apiError';

const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ApiError) {
    return failure(res, err.message, err, err.statusCode);
  }

  // Log the error for debugging purposes
  console.error(err);

  // For other types of errors, send a generic 500 response
  return failure(res, 'An unexpected error occurred', undefined, 500);
};

export default errorMiddleware;