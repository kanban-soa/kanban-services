import { Router } from "express";
import { NotificationController } from "@/noti-service/controllers";
import { NotificationsService } from "@/noti-service/services";

const router = Router();
const notificationsService = new NotificationsService();
const notificationController = new NotificationController(notificationsService);

router.get("/", notificationController.list);
router.get("/unread-count", notificationController.unreadCount);
router.post("/", notificationController.create);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:publicId/read", notificationController.markRead);
router.delete("/:publicId", notificationController.remove);

export default router;
