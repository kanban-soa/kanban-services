import { db } from '@/auth-service/config/database';
import { users } from '@/auth-service/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Repository (Structural): isolates all `users` table access behind a small
 * data-access object. Services depend on these methods instead of building
 * drizzle queries inline, keeping persistence concerns in one place.
 */
export class UserRepository {
  async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return db.select().from(users).where(inArray(users.id, ids));
  }

  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async insert(values: typeof users.$inferInsert) {
    const [created] = await db.insert(users).values(values).returning();
    return created;
  }

  async update(id: string, data: Partial<typeof users.$inferInsert>) {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }
}

export const userRepository = new UserRepository();
