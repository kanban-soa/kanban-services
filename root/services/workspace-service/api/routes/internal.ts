import { Router } from "express";
import { internalController } from "@workspace-service/api/controllers/internal.controller";

const router = Router();

// GET /internal/workspaces/:workspaceId/members/:userId/authorization
router.get(
  "/workspaces/:workspaceId/members/:userId/authorization",
  internalController.getAuthorization.bind(internalController)
);
router.get("/workspaces/:id/members/:userId", internalController.getMemberMe.bind(internalController));

export default router;
