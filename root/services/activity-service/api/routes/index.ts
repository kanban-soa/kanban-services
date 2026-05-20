import { Router } from "express";
import { activityController } from "@activity-service/api/controllers/activity.controller";
import { authMiddleware } from "@activity-service/middleware/auth";

const router = Router();

router.post("/internal/activities", activityController.createInternal.bind(activityController));

router.use(authMiddleware);
router.get(
  "/api/activities/workspaces/:workspaceId",
  activityController.list.bind(activityController),
);

export default router;

