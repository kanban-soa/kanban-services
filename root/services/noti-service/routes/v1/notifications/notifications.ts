import { Router } from "express";
import { NotificationController } from "@/noti-service/controllers";
import { NotificationsService } from "@/noti-service/services";

const router = Router();
const notificationsService = new NotificationsService();
const notificationController = new NotificationController(notificationsService);

router.post("/", notificationController.create);

export default router;
