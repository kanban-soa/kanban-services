import { ApiError, ERROR_CODES } from './errors';
import dotenv from 'dotenv';
dotenv.config();

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
}

export class AuthServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:9001';
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/internal/v1/auth/users/${userId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new ApiError(500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Auth service error');
      }
      return await response.json();
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to connect to Auth Service');
    }
  }

  async getUsersBulk(userIds: string[]): Promise<AuthUser[]> {
    if (!userIds || userIds.length === 0) return [];
    try {
      const response = await fetch(`${this.baseUrl}/internal/v1/auth/users/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: userIds }),
      });
      if (!response.ok) {
        throw new ApiError(500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Auth service error');
      }
      return await response.json();
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to connect to Auth Service');
    }
  }
}

export const authService = new AuthServiceClient();
