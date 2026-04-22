import { NotificationsService } from "@/noti-service/services";
import { Request, Response, NextFunction } from "express";

export class NotificationController{
  constructor(private readonly notificationsService: NotificationsService) {}

  public create = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const notification = await this.notificationsService.createNotification(data);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
