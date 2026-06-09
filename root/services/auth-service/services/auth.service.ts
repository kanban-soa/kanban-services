import { randomBytes } from 'crypto';
import { UsersService } from './users.service';
import {
  sessionRepository,
  accountRepository,
  verificationRepository,
  userRepository,
} from '@/auth-service/repositories';

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

    const created = await sessionRepository.insert({
      token,
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
      expiresAt,
    });

    return created;
  }

  static async getSession(token: string) {
    const result = await sessionRepository.findByToken(token);

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

    const user = await userRepository.findById(sess.userId);

    if (!user) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return { session: sess, user: userWithoutPassword };
  }

  static async deleteSession(sessionId: number) {
    await sessionRepository.deleteById(sessionId);
    return true;
  }

  static async deleteSessionByToken(token: string) {
    await sessionRepository.deleteByToken(token);
    return true;
  }

  static async deleteUserSessions(userId: string) {
    await sessionRepository.deleteByUserId(userId);
    return true;
  }

  static async linkAccount(input: CreateAccountInput) {
    const existing = await accountRepository.findByUserAndProvider(input.userId, input.providerId);

    if (existing) {
      const updated = await accountRepository.update(existing.id, {
        accessToken: input.accessToken || existing.accessToken,
        refreshToken: input.refreshToken || existing.refreshToken,
        idToken: input.idToken || existing.idToken,
        scope: input.scope || existing.scope,
        updatedAt: new Date(),
      });

      return updated;
    }

    const created = await accountRepository.insert({
      userId: input.userId,
      providerId: input.providerId,
      accountId: input.accountId,
      accessToken: input.accessToken || null,
      refreshToken: input.refreshToken || null,
      idToken: input.idToken || null,
      scope: input.scope || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return created;
  }

  static async getUserAccounts(userId: string) {
    return accountRepository.findByUserId(userId);
  }

  static async unlinkAccount(userId: string, providerId: string) {
    const linked = await accountRepository.findByUserAndProvider(userId, providerId);

    if (!linked) {
      throw new Error('Account not linked');
    }

    await accountRepository.deleteById(linked.id);
    return true;
  }

  static async createVerification(input: CreateVerificationInput) {
    const expiresInMinutes = input.expiresInMinutes || 15;
    const value = input.value || generateVerificationCode();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const existing = await verificationRepository.findByIdentifier(input.identifier);

    if (existing) {
      await verificationRepository.deleteById(existing.id);
    }

    const created = await verificationRepository.insert({
      identifier: input.identifier,
      value,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return created;
  }

  static async verifyCode(identifier: string, code: string) {
    const record = await verificationRepository.findByIdentifierAndValue(identifier, code);

    if (!record) {
      throw new Error('Invalid verification code');
    }

    if (new Date() > record.expiresAt) {
      await verificationRepository.deleteById(record.id);
      throw new Error('Verification code expired');
    }

    await verificationRepository.deleteById(record.id);
    return true;
  }

  static async cleanupExpiredVerifications() {
    const now = new Date();
    await verificationRepository.deleteExpired(now);
  }

  static async cleanupExpiredSessions() {
    const now = new Date();
    await sessionRepository.deleteExpired(now);
  }

  static async getUserById(userId: string) {
    return UsersService.getUserById(userId);
  }
}
