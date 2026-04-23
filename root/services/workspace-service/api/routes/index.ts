import { Router } from "express";
import { workspaceController } from "@workspace-service/api/controllers/workspace.controller";
import { memberController } from "@workspace-service/api/controllers/member.controller";
import { permissionController } from "@workspace-service/api/controllers/permission.controller";

const router = Router();

// Middleware to mock authentication for testing if needed
// In a real scenario, there would be an auth middleware applied to these routes
// router.use(authMiddleware);

// --- Workspace Routes ---
router.post("/", workspaceController.create.bind(workspaceController));
router.get("/", workspaceController.getAll.bind(workspaceController));
router.get("/:id", workspaceController.getById.bind(workspaceController));
router.patch("/:id", workspaceController.update.bind(workspaceController));
router.delete("/:id", workspaceController.delete.bind(workspaceController));

// --- Member Routes ---
router.get("/:id/members", memberController.getMembers.bind(memberController));
router.post("/:id/members", memberController.inviteMember.bind(memberController));
router.get("/:id/members/:memberId", memberController.getMember.bind(memberController));
router.patch("/:id/members/:memberId", memberController.updateMemberRole.bind(memberController));
router.delete("/:id/members/:memberId", memberController.removeMember.bind(memberController));

// --- Permission & Role Routes ---
router.get("/:id/permissions", (req, res, next) => {
  // Check if there is a 'permission' query param, which means it's a checkPermission request
  if (req.query.permission) {
    return permissionController.checkPermission(req, res);
  }
  return permissionController.getPermissions(req, res);
});

router.post("/:id/permissions", permissionController.checkPermission.bind(permissionController)); // Support POST body check

// Roles
router.get("/:id/roles", permissionController.getRoles.bind(permissionController));
router.post("/:id/roles", permissionController.createRole.bind(permissionController));
router.get("/:id/roles/:roleId/permissions", permissionController.getRolePermissions.bind(permissionController));
router.post("/:id/roles/:roleId/permissions", permissionController.grantPermission.bind(permissionController));

export default router;
