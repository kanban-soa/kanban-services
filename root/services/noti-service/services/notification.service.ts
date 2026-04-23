import { db } from '@/noti-service/config';
import { notifications } from '@/noti-service/schema';
import { eq } from 'drizzle-orm';

export class NotificationsService {
  public async createNotification(data: {
    publicId: string;
    type: string;
    userId: string;
    cardId: string;
    commentId: string;
    workspaceId: string;
    metadata: any;
  }) {
    const result = await db.insert(notifications).values({
      ...data,
      read: false,
      createdAt: new Date(),
      deletedAt: null,
    }).returning();
    return result[0];
  }

  public async readNotifications(userId: string, workspaceId: string) {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }
}
