import type { NextFunction, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { AuthenticatedRequest } from '../types';
import config from '../config/env';
import { sendGatewayError } from '../utils/response';

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
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
    const payload = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload & {
      id?: string | number;
      email?: string;
      role?: string;
    };

    const idValue = payload.id ?? payload.sub;
    if (idValue === undefined || idValue === null) {
      sendGatewayError(res, req, 401, 'invalid_token', 'Token is missing subject');
      return;
    }

    req.user = {
      id: String(idValue),
      email: payload.email,
      role: payload.role,
      iat: payload.iat,
      exp: payload.exp,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      sendGatewayError(res, req, 401, 'token_expired', 'Token has expired');
      return;
    }

    sendGatewayError(res, req, 401, 'invalid_token', 'Token is invalid');
  }
}

