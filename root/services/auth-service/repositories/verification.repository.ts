import { db } from '@/auth-service/config/database';
import { verification } from '@/auth-service/schema/auth';
import { eq, and, lt as lessThan } from 'drizzle-orm';

/**
 * Repository (Structural): all `verification` table access in one object.
 */
export class VerificationRepository {
  async findByIdentifier(identifier: string) {
    const [result] = await db.select()
      .from(verification)
      .where(eq(verification.identifier, identifier))
      .limit(1);
    return result || null;
  }

  async findByIdentifierAndValue(identifier: string, value: string) {
    const [result] = await db.select()
      .from(verification)
      .where(and(eq(verification.identifier, identifier), eq(verification.value, value)))
      .limit(1);
    return result || null;
  }

  async insert(values: typeof verification.$inferInsert) {
    const [created] = await db.insert(verification).values(values as any).returning();
    return created;
  }

  async deleteById(id: number) {
    await db.delete(verification).where(eq(verification.id, id));
    return true;
  }

  async deleteExpired(now: Date) {
    await db.delete(verification).where(lessThan(verification.expiresAt, now));
  }
}

export const verificationRepository = new VerificationRepository();
