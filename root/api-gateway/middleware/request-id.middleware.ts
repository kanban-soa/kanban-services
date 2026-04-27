import type { NextFunction, RequestHandler, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { AuthenticatedRequest } from '../types';

export const requestIdMiddleware: RequestHandler = (req, res, next): void => {
  const existingId = req.headers['x-request-id'];
  const requestId = typeof existingId === 'string' && existingId.length > 0 ? existingId : uuidv4();

  const typedReq = req as AuthenticatedRequest;
  typedReq.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
