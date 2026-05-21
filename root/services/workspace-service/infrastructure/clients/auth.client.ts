import { BaseClient } from "./base.client";
import config from "@workspace-service/config/env";

/**
 * Auth service response types
 */
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name?: string;
  avatarUrl?: string;
  createdAt?: string;
}

/**
 * AuthClient
 * Communicates with the auth-service for user verification and lookup.
 *
 * Endpoints:
 *   GET  /internal/v1/auth/users/:id         → getUserById
 *   GET  /internal/v1/auth/users?email=      → getUserByEmail
 */
class AuthClient extends BaseClient {
  constructor() {
    super(config.services.authUrl, "auth-service");
  }

  /**
   * Override BaseClient get because auth-service doesn't wrap responses in { data: T }
   */
  protected async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Get user by ID
   * Throws on 404 (user not found)
   */
  async getUserById(userId: string): Promise<AuthUser> {
    return this.get<AuthUser>(`/internal/v1/auth/users/${userId}`);
  }

  /**
   * Get user by email
   * Throws on 404 (user not found)
   */
  async getUserByEmail(email: string): Promise<AuthUser> {
    return this.get<AuthUser>("/internal/v1/auth/users", { params: { email } });
  }

  /**
   * Check if a user exists — returns boolean, never throws
   */
  async checkUserExists(userId: string): Promise<boolean> {
    try {
      await this.getUserById(userId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get multiple users by ID
   */
  async getUsersBulk(userIds: string[]): Promise<AuthUser[]> {
    if (!userIds || userIds.length === 0) return [];
    // The auth-service bulk endpoint expects { ids: string[] }
    // and returns AuthUser[] directly (based on my previous controller update)
    // Note: getUserById was overridden to return response.data directly
    // because auth-service doesn't wrap in { data: T } for some endpoints.
    // Let's check if we should use this.get or this.client.post
    
    const response = await this.client.post<AuthUser[]>("/internal/v1/auth/users/bulk", { ids: userIds });
    return response.data;
  }
}

export const authClient = new AuthClient();
