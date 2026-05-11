import { db } from '@/auth-service/config/database';
import { users } from '@/auth-service/schema/users';
import { session, account, verification } from '@/auth-service/schema/auth';
import { eq, and, lt as lessThan } from 'drizzle-orm';
import { hashPassword } from '@/auth-service/lib';
import { randomBytes } from 'crypto';
import { UsersService } from './users.service';

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

function generateVerificationCode(length: number = 6): string {
  return randomBytes(length).toString('hex').slice(0, length);
}

export interface CreateSessionInput {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateAccountInput {
  userId: string;
  providerId: string;
  accountId: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  scope?: string;
}

export interface CreateVerificationInput {
  identifier: string;
  value?: string;
  expiresInMinutes?: number;
}

export class AuthService {

  static async createSession(input: CreateSessionInput) {
    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [created] = await db.insert(session).values({
      token,
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
      expiresAt,
    } as any).returning();

    return created;
  }

  static async getSession(token: string) {
    const [result] = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (!result) {
      return null;
    }

    if (new Date() > result.expiresAt) {
      await this.deleteSession(result.id);
      return null;
    }

    return result;
  }

  static async getSessionWithUser(token: string) {
    const sess = await this.getSession(token);
    if (!sess) {
      return null;
    }

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, sess.userId))
      .limit(1);

    if (!user) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return { session: sess, user: userWithoutPassword };
  }

  static async deleteSession(sessionId: number) {
    await db.delete(session).where(eq(session.id, sessionId));
    return true;
  }

  static async deleteSessionByToken(token: string) {
    await db.delete(session).where(eq(session.token, token));
    return true;
  }

  static async deleteUserSessions(userId: string) {
    await db.delete(session).where(eq(session.userId, userId));
    return true;
  }

  static async linkAccount(input: CreateAccountInput) {
    const [existing] = await db.select()
      .from(account)
      .where(
        and(
          eq(account.userId, input.userId),
          eq(account.providerId, input.providerId)
        )
      )
      .limit(1);

    if (existing) {
      const [updated] = await db.update(account)
        .set({
          accessToken: input.accessToken || existing.accessToken,
          refreshToken: input.refreshToken || existing.refreshToken,
          idToken: input.idToken || existing.idToken,
          scope: input.scope || existing.scope,
          updatedAt: new Date(),
        })
        .where(eq(account.id, existing.id))
        .returning();

      return updated;
    }

    const [created] = await db.insert(account).values({
      userId: input.userId,
      providerId: input.providerId,
      accountId: input.accountId,
      accessToken: input.accessToken || null,
      refreshToken: input.refreshToken || null,
      idToken: input.idToken || null,
      scope: input.scope || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any).returning();

    return created;
  }

  static async getUserAccounts(userId: string) {
    return db.select()
      .from(account)
      .where(eq(account.userId, userId));
  }

  static async unlinkAccount(userId: string, providerId: string) {
    const [linked] = await db.select()
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, providerId)
        )
      )
      .limit(1);

    if (!linked) {
      throw new Error('Account not linked');
    }

    await db.delete(account).where(eq(account.id, linked.id));
    return true;
  }

  static async createVerification(input: CreateVerificationInput) {
    const expiresInMinutes = input.expiresInMinutes || 15;
    const value = input.value || generateVerificationCode();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const [existing] = await db.select()
      .from(verification)
      .where(eq(verification.identifier, input.identifier))
      .limit(1);

    if (existing) {
      await db.delete(verification).where(eq(verification.id, existing.id));
    }

    const [created] = await db.insert(verification).values({
      identifier: input.identifier,
      value,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any).returning();

    return created;
  }

  static async verifyCode(identifier: string, code: string) {
    const [record] = await db.select()
      .from(verification)
      .where(
        and(
          eq(verification.identifier, identifier),
          eq(verification.value, code)
        )
      )
      .limit(1);

    if (!record) {
      throw new Error('Invalid verification code');
    }

    if (new Date() > record.expiresAt) {
      await db.delete(verification).where(eq(verification.id, record.id));
      throw new Error('Verification code expired');
    }

    await db.delete(verification).where(eq(verification.id, record.id));
    return true;
  }

  static async cleanupExpiredVerifications() {
    const now = new Date();
    await db.delete(verification)
      .where(lessThan(verification.expiresAt, now));
  }

  static async cleanupExpiredSessions() {
    const now = new Date();
    await db.delete(session)
      .where(lessThan(session.expiresAt, now));
  }

  static async getUserById(userId: string) {
    return UsersService.getUserById(userId);
  }
}