import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import config from '../config/env';
import { sendGatewayError } from '../utils/response';

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const route = req.matchedRoute;
  if (route && route.auth === false) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;

  if (!token) {
    sendGatewayError(res, req, 401, 'missing_token', 'Authorization token is required');
    return;
  }

  try {
    const response = await fetch(`${config.services.auth}/api/sessions/verify-jwt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(config.upstreamTimeoutMs),
    });

    if (!response.ok) {
      sendGatewayError(res, req, 401, 'invalid_token', 'Token is invalid or expired');
      return;
    }

    const data = await response.json();

    if (!data?.user || !data?.token) {
      sendGatewayError(res, req, 401, 'invalid_token', 'Token is invalid or expired');
      return;
    }

    const { user, token: tokenData } = data;

    req.user = {
      id: String(tokenData.sub),
      email: user.email,
      role: tokenData.role || 'user',
      iat: tokenData.iat,
      exp: tokenData.exp,
    };

    next();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      sendGatewayError(res, req, 504, 'auth_timeout', 'Authentication service did not respond in time');
      return;
    }
    sendGatewayError(res, req, 502, 'auth_unavailable', 'Could not reach authentication service');
  }
}

