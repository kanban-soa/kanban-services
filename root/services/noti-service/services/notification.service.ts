import { db } from '@/noti-service/config';
import { notifications } from '@/noti-service/schema';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12,
);

export interface CreateNotificationInput {
  type: string;
  userId: string;
  cardId: string;
  commentId: string;
  workspaceId: string;
  metadata?: unknown;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export class NotificationsService {
  public async createNotification(data: CreateNotificationInput) {
    const metadata =
      data.metadata === undefined || data.metadata === null
        ? null
        : typeof data.metadata === 'string'
          ? data.metadata
          : JSON.stringify(data.metadata);

    const [row] = await db
      .insert(notifications)
      .values({
        publicId: nanoid(),
        type: data.type,
        userId: data.userId,
        cardId: data.cardId,
        commentId: data.commentId,
        workspaceId: data.workspaceId,
        metadata,
        read: false,
      })
      .returning();
    return row;
  }

  public async listForUser(userId: string, opts: ListOptions = {}) {
    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
    const offset = Math.max(opts.offset ?? 0, 0);

    const conditions = [eq(notifications.userId, userId), isNull(notifications.deletedAt)];
    if (opts.unreadOnly) {
      conditions.push(eq(notifications.read, false));
    }

    return db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  public async getUnreadCount(userId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false),
          isNull(notifications.deletedAt),
        ),
      );
    return row?.count ?? 0;
  }

  public async markAsRead(publicId: string, userId: string) {
    const [row] = await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.publicId, publicId),
          eq(notifications.userId, userId),
          isNull(notifications.deletedAt),
        ),
      )
      .returning();
    return row ?? null;
  }

  public async markAllAsRead(userId: string) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false),
          isNull(notifications.deletedAt),
        ),
      );
  }

  public async deleteNotification(publicId: string, userId: string) {
    const [row] = await db
      .update(notifications)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(notifications.publicId, publicId),
          eq(notifications.userId, userId),
          isNull(notifications.deletedAt),
        ),
      )
      .returning();
    return row ?? null;
  }
}
