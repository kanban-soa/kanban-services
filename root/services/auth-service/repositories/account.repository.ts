import { db } from '@/auth-service/config/database';
import { account } from '@/auth-service/schema/auth';
import { eq, and } from 'drizzle-orm';

/**
 * Repository (Structural): all `account` table access in one object.
 */
export class AccountRepository {
  async findByUserAndProvider(userId: string, providerId: string) {
    const [result] = await db.select()
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, providerId)))
      .limit(1);
    return result || null;
  }

  async findByUserId(userId: string) {
    return db.select().from(account).where(eq(account.userId, userId));
  }

  async insert(values: typeof account.$inferInsert) {
    const [created] = await db.insert(account).values(values as any).returning();
    return created;
  }

  async update(id: number, data: Partial<typeof account.$inferInsert>) {
    const [updated] = await db.update(account).set(data).where(eq(account.id, id)).returning();
    return updated;
  }

  async deleteById(id: number) {
    await db.delete(account).where(eq(account.id, id));
    return true;
  }
}

export const accountRepository = new AccountRepository();
