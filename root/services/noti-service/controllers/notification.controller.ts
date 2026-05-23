import { NotificationsService } from "@/noti-service/services";
import { Request, Response } from "express";

function getUserId(req: Request): string | null {
  const header = req.headers['x-user-id'];
  if (typeof header === 'string' && header.trim()) return header.trim();
  if (Array.isArray(header) && header[0]) return header[0];
  return null;
}

export class NotificationController {
  constructor(private readonly notificationsService: NotificationsService) {}

  public create = async (req: Request, res: Response) => {
    try {
      const { type, userId, cardId, commentId, workspaceId, metadata } = req.body ?? {};
      if (!type || !userId || !cardId || !commentId || !workspaceId) {
        return res.status(400).json({
          error: 'type, userId, cardId, commentId and workspaceId are required',
        });
      }
      const notification = await this.notificationsService.createNotification({
        type,
        userId,
        cardId,
        commentId,
        workspaceId,
        metadata,
      });
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public list = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Missing x-user-id' });

      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;
      const unreadOnly = req.query.unread === 'true' || req.query.unread === '1';

      const items = await this.notificationsService.listForUser(userId, {
        limit,
        offset,
        unreadOnly,
      });
      res.json({ items });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public unreadCount = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Missing x-user-id' });
      const count = await this.notificationsService.getUnreadCount(userId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public markRead = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Missing x-user-id' });
      const { publicId } = req.params;
      const row = await this.notificationsService.markAsRead(publicId, userId);
      if (!row) return res.status(404).json({ error: 'Notification not found' });
      res.json(row);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public markAllRead = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Missing x-user-id' });
      await this.notificationsService.markAllAsRead(userId);
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public remove = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Missing x-user-id' });
      const { publicId } = req.params;
      const row = await this.notificationsService.deleteNotification(publicId, userId);
      if (!row) return res.status(404).json({ error: 'Notification not found' });
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
