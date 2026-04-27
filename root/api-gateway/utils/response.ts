import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';

export interface GatewayError {
  error: string;
  message: string;
  requestId: string;
}

export function sendGatewayError(
  res: Response,
  req: AuthenticatedRequest,
  status: number,
  error: string,
  message: string,
  extra?: Record<string, unknown>
): void {
  const payload: GatewayError & Record<string, unknown> = {
    error,
    message,
    requestId: req.requestId,
    ...(extra ?? {}),
  };
  res.status(status).json(payload);
}

