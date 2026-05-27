import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

// ---- Repository mocks -------------------------------------------------------

vi.mock("@workspace-service/repositories/workspace.repo", () => ({
  workspaceRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findByPublicId: vi.fn(),
    findLatestByUser: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    slugExists: vi.fn(),
  },
}));

vi.mock("@workspace-service/repositories/member.repo", () => ({
  memberRepository: {
    create: vi.fn(),
    countByWorkspace: vi.fn().mockResolvedValue(1),
    findByUserAndWorkspace: vi.fn(),
    findWorkspacesByUserId: vi.fn(),
  },
}));

vi.mock("@workspace-service/repositories/permission.repo", () => ({
  permissionRepository: {
    getRoleByName: vi.fn().mockResolvedValue(null),
    createRole: vi.fn().mockResolvedValue({ id: 1, name: "Admin" }),
    getRoleById: vi.fn(),
    getRolesByWorkspace: vi.fn(),
    createRolePermission: vi.fn(),
    getRolePermissions: vi.fn(),
    updateRolePermission: vi.fn(),
    roleHasPermission: vi.fn(),
    getMemberPermissions: vi.fn(),
    createMemberPermission: vi.fn(),
    updateMemberPermission: vi.fn(),
  },
}));

// ---- External-service client mocks -----------------------------------------

vi.mock("@workspace-service/infrastructure/clients/auth.client", () => ({
  authClient: {
    getUserById: vi.fn().mockResolvedValue({ id: "U1", email: "u1@x.com" }),
    getUserByEmail: vi.fn(),
    checkUserExists: vi.fn().mockResolvedValue(true),
    getUsersByIds: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@workspace-service/infrastructure/clients", async () => {
  return {
    boardClient: {
      deleteBoardsByWorkspace: vi.fn(),
      getBoardsByWorkspace: vi.fn(),
    },
    authClient: {
      getUserById: vi.fn().mockResolvedValue({ id: "U1", email: "u1@x.com" }),
    },
    notificationClient: {},
  };
});

import app from "@workspace-service/index";
import { workspaceRepository } from "@workspace-service/repositories/workspace.repo";
import { memberRepository } from "@workspace-service/repositories/member.repo";
import { boardClient } from "@workspace-service/infrastructure/clients";

const wsRepo = workspaceRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mbRepo = memberRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;
const bClient = boardClient as unknown as Record<string, ReturnType<typeof vi.fn>>;

function authHeaders(userId = "U1", email = "u1@x.com", role = "user") {
  return {
    "x-user-id": userId,
    "x-user-email": email,
    "x-user-role": role,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mbRepo.countByWorkspace.mockResolvedValue(1);
});

// =============================================================================
// Nhóm A — Tạo workspace (POST /api/workspaces)
// =============================================================================

describe("Nhóm A — Tạo workspace", () => {
  // TC01: Tạo workspace trên giao diện (happy path)
  it("TC01: Người dùng tạo workspace trên giao diện thành công", async () => {
    wsRepo.slugExists.mockResolvedValue(false);
    wsRepo.create.mockResolvedValue({
      id: 1,
      publicId: "WS1",
      name: "Acme",
      slug: "acme",
      plan: "free",
      createdBy: "U1",
    });

    const res = await request(app)
      .post("/api/workspaces")
      .set(authHeaders())
      .send({ name: "Acme" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.publicId).toBe("WS1");
    expect(res.body.data.name).toBe("Acme");
  });

  // TC02: Tạo workspace nhưng để trống tên
  it("TC02: Tạo workspace nhưng bỏ trống tên → báo lỗi", async () => {
    const res = await request(app)
      .post("/api/workspaces")
      .set(authHeaders())
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe(1041);
    expect(wsRepo.create).not.toHaveBeenCalled();
  });

  // TC03: Tạo workspace nhưng trùng tên
  it("TC03: Tạo workspace trùng tên với workspace đã có → hệ thống tự sinh slug khác, vẫn tạo thành công", async () => {
    // Tên "Acme" → slug "acme" đã tồn tại trong hệ thống → trùng tên
    wsRepo.slugExists.mockResolvedValueOnce(true);
    wsRepo.create.mockImplementation(async (input: any) => ({
      id: 2,
      publicId: "WS2",
      ...input,
    }));

    const res = await request(app)
      .post("/api/workspaces")
      .set(authHeaders())
      .send({ name: "Acme" });

    expect(res.status).toBe(201);
    const persistedSlug = wsRepo.create.mock.calls[0][0].slug;
    expect(persistedSlug).not.toBe("acme");
    expect(persistedSlug.startsWith("acme-")).toBe(true);
  });
});

// =============================================================================
// UC-WS-02 — GET /api/workspaces
// =============================================================================

describe("UC-WS-02 — GET /api/workspaces", () => {
  it("IT-05: returns only non-soft-deleted workspaces the user belongs to", async () => {
    mbRepo.findWorkspacesByUserId.mockResolvedValue([
      { workspaceId: 1 },
      { workspaceId: 2 },
      { workspaceId: 3 },
    ]);
    wsRepo.findById.mockImplementation(async (id: number) => {
      if (id === 1) return { id: 1, name: "A", deletedAt: null };
      if (id === 2) return { id: 2, name: "B", deletedAt: new Date() };
      if (id === 3) return { id: 3, name: "C", deletedAt: null };
      return null;
    });

    const res = await request(app).get("/api/workspaces").set(authHeaders());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.map((w: any) => w.id).sort()).toEqual([1, 3]);
  });
});

// =============================================================================
// UC-WS-03 — GET /api/workspaces/default
// =============================================================================

describe("UC-WS-03 — GET /api/workspaces/default", () => {
  it("IT-06: 200 with latest workspace when user has at least one", async () => {
    wsRepo.findLatestByUser.mockResolvedValue({
      id: 7,
      publicId: "WS7",
      name: "Latest",
      deletedAt: null,
    });
    mbRepo.countByWorkspace.mockResolvedValue(3);

    const res = await request(app)
      .get("/api/workspaces/default")
      .set(authHeaders());

    expect(res.status).toBe(200);
    expect(res.body.data.publicId).toBe("WS7");
    expect(res.body.data.members).toBe(3);
  });

  it("IT-07: 404 WORKSPACE_NOT_FOUND when the user has no workspace", async () => {
    wsRepo.findLatestByUser.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/workspaces/default")
      .set(authHeaders());

    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe(1001);
  });
});

// =============================================================================
// UC-WS-04 — GET /api/workspaces/:id
// =============================================================================

describe("UC-WS-04 — GET /api/workspaces/:id", () => {
  it("IT-08: 403 PERMISSION_DENIED when caller is not a member", async () => {
    wsRepo.findByPublicId.mockResolvedValue({ id: 1, publicId: "WS1", name: "X" });
    mbRepo.findByUserAndWorkspace.mockResolvedValue(null); // not a member

    const res = await request(app)
      .get("/api/workspaces/WS1")
      .set(authHeaders("U2", "u2@x.com"));

    expect(res.status).toBe(403);
  });

  it("IT-09: 404 WORKSPACE_NOT_FOUND when publicId does not match any workspace", async () => {
    wsRepo.findByPublicId.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/workspaces/UNKNOWN")
      .set(authHeaders());

    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe(1001);
  });
});

// =============================================================================
// UC-WS-05 — PATCH /api/workspaces/:id
// =============================================================================

describe("UC-WS-05 — PATCH /api/workspaces/:id", () => {
  it("IT-10: admin can update description → 200 and update() called", async () => {
    wsRepo.findByPublicId.mockResolvedValue({ id: 1, publicId: "WS1", name: "X" });
    mbRepo.findByUserAndWorkspace.mockResolvedValue({
      id: 1,
      userId: "U1",
      workspaceId: 1,
      role: "admin",
    });
    wsRepo.update.mockResolvedValue({ id: 1, name: "X", description: "new" });

    const res = await request(app)
      .patch("/api/workspaces/WS1")
      .set(authHeaders())
      .send({ description: "new" });

    expect(res.status).toBe(200);
    expect(wsRepo.update).toHaveBeenCalledWith(1, {
      name: undefined,
      slug: undefined,
      description: "new",
    });
  });

  it("IT-11: non-admin member → 403 PERMISSION_DENIED", async () => {
    wsRepo.findByPublicId.mockResolvedValue({ id: 1, publicId: "WS1", name: "X" });
    mbRepo.findByUserAndWorkspace.mockResolvedValue({
      id: 2,
      userId: "U2",
      workspaceId: 1,
      role: "member",
    });

    const res = await request(app)
      .patch("/api/workspaces/WS1")
      .set(authHeaders("U2", "u2@x.com"))
      .send({ name: "X2" });

    expect(res.status).toBe(403);
    expect(wsRepo.update).not.toHaveBeenCalled();
  });

  it("IT-12: 409 WORKSPACE_SLUG_EXISTS when slug already taken by another workspace", async () => {
    wsRepo.findByPublicId.mockResolvedValue({ id: 1, publicId: "WS1" });
    mbRepo.findByUserAndWorkspace.mockResolvedValue({
      id: 1,
      userId: "U1",
      workspaceId: 1,
      role: "admin",
    });
    wsRepo.slugExists.mockResolvedValue(true);

    const res = await request(app)
      .patch("/api/workspaces/WS1")
      .set(authHeaders())
      .send({ slug: "taken" });

    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe(1002);
    expect(wsRepo.update).not.toHaveBeenCalled();
  });
});

// =============================================================================
// UC-WS-06 — DELETE /api/workspaces/:id
// =============================================================================

describe("UC-WS-06 — DELETE /api/workspaces/:id", () => {
  it("IT-13: admin → 204, soft delete called, board cleanup invoked", async () => {
    wsRepo.findByPublicId.mockResolvedValue({
      id: 5,
      publicId: "WS5",
      name: "ToDelete",
      deletedAt: null,
    });
    wsRepo.findById.mockResolvedValue({
      id: 5,
      publicId: "WS5",
      name: "ToDelete",
      deletedAt: null,
    });
    mbRepo.findByUserAndWorkspace.mockResolvedValue({
      id: 1,
      userId: "U1",
      workspaceId: 5,
      role: "admin",
    });
    wsRepo.softDelete.mockResolvedValue({ id: 5, deletedAt: new Date() });
    bClient.deleteBoardsByWorkspace.mockResolvedValue(undefined);

    const res = await request(app)
      .delete("/api/workspaces/WS5")
      .set(authHeaders());

    expect(res.status).toBe(204);
    expect(wsRepo.softDelete).toHaveBeenCalledWith(5, "U1");
  });

  it("IT-14: board-service failure does not block workspace deletion (still 204)", async () => {
    wsRepo.findByPublicId.mockResolvedValue({
      id: 5,
      publicId: "WS5",
      name: "ToDelete",
      deletedAt: null,
    });
    wsRepo.findById.mockResolvedValue({
      id: 5,
      publicId: "WS5",
      name: "ToDelete",
      deletedAt: null,
    });
    mbRepo.findByUserAndWorkspace.mockResolvedValue({
      id: 1,
      userId: "U1",
      workspaceId: 5,
      role: "admin",
    });
    wsRepo.softDelete.mockResolvedValue({ id: 5, deletedAt: new Date() });
    bClient.deleteBoardsByWorkspace.mockRejectedValue(new Error("board service down"));

    const res = await request(app)
      .delete("/api/workspaces/WS5")
      .set(authHeaders());

    expect(res.status).toBe(204);
    expect(wsRepo.softDelete).toHaveBeenCalledWith(5, "U1");
  });
});
