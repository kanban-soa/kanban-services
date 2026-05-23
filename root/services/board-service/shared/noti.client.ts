import dotenv from 'dotenv';

dotenv.config();

export interface CreateNotificationPayload {
  type: string;
  userId: string;
  cardId: string;
  commentId: string;
  workspaceId: string;
  metadata?: Record<string, unknown> | null;
}

export class NotificationServiceClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = process.env.NOTI_SERVICE_URL || 'http://localhost:9004';
    this.timeoutMs = Number(process.env.NOTI_SERVICE_TIMEOUT_MS ?? 5000);
  }

  async createNotification(payload: CreateNotificationPayload): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/api/notifications`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) {
        console.warn('noti-service rejected notification', res.status);
      }
    } catch (error) {
      console.warn('Failed to create notification', error);
    }
  }
}

export const notificationService = new NotificationServiceClient();
