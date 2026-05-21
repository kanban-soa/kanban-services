import dotenv from 'dotenv';
dotenv.config();

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name?: string;
  image?: string;
  createdAt?: string;
}

export class AuthServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:9001';
  }

  async getUserById(userId: string): Promise<AuthUser> {
    try {
      const response = await fetch(`${this.baseUrl}/internal/v1/auth/users/${userId}`);
      if (!response.ok) {
        throw new Error(`Auth service returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching user ${userId} from auth-service:`, error);
      throw error;
    }
  }

  async getUsersByIds(userIds: string[]): Promise<AuthUser[]> {
    if (userIds.length === 0) return [];
    try {
      const response = await fetch(`${this.baseUrl}/internal/v1/auth/users?ids=${userIds.join(',')}`);
      if (!response.ok) {
        throw new Error(`Auth service returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching batch users from auth-service:`, error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<AuthUser> {
    try {
      const response = await fetch(`${this.baseUrl}/internal/v1/auth/users?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error(`Auth service returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching user by email ${email} from auth-service:`, error);
      throw error;
    }
  }
}

export const authService = new AuthServiceClient();
