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
 *   GET  /api/users/:id         → getUserById
 *   GET  /api/users?email=      → getUserByEmail
 */
class AuthClient extends BaseClient {
  constructor() {
    super(config.services.authUrl, "auth-service");
  }

  /**
   * Get user by ID
   * Throws on 404 (user not found)
   */
  async getUserById(userId: string): Promise<AuthUser> {
    return this.get<AuthUser>(`/api/users/${userId}`);
  }

  /**
   * Get user by email
   * Throws on 404 (user not found)
   */
  async getUserByEmail(email: string): Promise<AuthUser> {
    return this.get<AuthUser>("/api/users", { params: { email } });
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
}

export const authClient = new AuthClient();
