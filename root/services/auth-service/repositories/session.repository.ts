import { db } from '@/auth-service/config/database';
import { session } from '@/auth-service/schema/auth';
import { eq, lt as lessThan } from 'drizzle-orm';

/**
 * Repository (Structural): all `session` table access in one object.
 */
export class SessionRepository {
  async insert(values: typeof session.$inferInsert) {
    const [created] = await db.insert(session).values(values as any).returning();
    return created;
  }

  async findByToken(token: string) {
    const [result] = await db.select().from(session).where(eq(session.token, token)).limit(1);
    return result || null;
  }

  async deleteById(id: number) {
    await db.delete(session).where(eq(session.id, id));
    return true;
  }

  async deleteByToken(token: string) {
    await db.delete(session).where(eq(session.token, token));
    return true;
  }

  async deleteByUserId(userId: string) {
    await db.delete(session).where(eq(session.userId, userId));
    return true;
  }

  async deleteExpired(now: Date) {
    await db.delete(session).where(lessThan(session.expiresAt, now));
  }
}

export const sessionRepository = new SessionRepository();
