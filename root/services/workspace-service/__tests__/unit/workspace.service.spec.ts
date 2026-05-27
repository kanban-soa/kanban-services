import { describe, it, expect, beforeEach, vi } from "vitest";

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

vi.mock("@workspace-service/infrastructure/clients/auth.client", () => ({
  authClient: {
    getUserById: vi.fn().mockResolvedValue({ id: "U1", email: "u1@x.com" }),
  },
}));

import { workspaceService } from "@workspace-service/services/workspace.service";
import { workspaceRepository } from "@workspace-service/repositories/workspace.repo";
import { memberRepository } from "@workspace-service/repositories/member.repo";
import { AppError } from "@workspace-service/utils/AppError";
import { ERROR_CODES } from "@workspace-service/config/constants";

const wsRepo = workspaceRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mbRepo = memberRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.clearAllMocks();
  mbRepo.countByWorkspace.mockResolvedValue(1);
});

// Nhóm A (Tạo workspace) chỉ kiểm thử ở tầng giao diện (integration) — xem workspace.api.spec.ts.

describe("UC-WS-02 — getWorkspacesByUser", () => {
  it("UT-14: filters out workspaces that have deletedAt set", async () => {
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

    const result = await workspaceService.getWorkspacesByUser("U1");

    expect(result).toHaveLength(2);
    expect(result.map((w: any) => w.id).sort()).toEqual([1, 3]);
  });
});

describe("UC-WS-03 — getDefaultWorkspace", () => {
  it("UT-20: throws WORKSPACE_NOT_FOUND when user has no workspace", async () => {
    wsRepo.findLatestByUser.mockResolvedValue(null);

    await expect(workspaceService.getDefaultWorkspace("U1")).rejects.toBeInstanceOf(AppError);
    await expect(workspaceService.getDefaultWorkspace("U1")).rejects.toMatchObject({
      code: ERROR_CODES.WORKSPACE_NOT_FOUND,
    });
  });
});

describe("UC-WS-05 — updateWorkspace", () => {
  it("UT-04: throws WORKSPACE_SLUG_EXISTS when the new slug collides with another workspace", async () => {
    wsRepo.slugExists.mockResolvedValue(true);

    await expect(
      workspaceService.updateWorkspace(10, { slug: "taken" })
    ).rejects.toMatchObject({ code: ERROR_CODES.WORKSPACE_SLUG_EXISTS });

    expect(wsRepo.slugExists).toHaveBeenCalledWith("taken", 10);
    expect(wsRepo.update).not.toHaveBeenCalled();
  });

  it("UT-05: allows update when slug matches the workspace's own current slug (excluded from check)", async () => {
    wsRepo.slugExists.mockResolvedValue(false); // not found outside this workspace
    wsRepo.update.mockResolvedValue({ id: 10, slug: "acme", name: "Acme" });

    const result = await workspaceService.updateWorkspace(10, { slug: "acme" });

    expect(wsRepo.slugExists).toHaveBeenCalledWith("acme", 10);
    expect(wsRepo.update).toHaveBeenCalledWith(10, { slug: "acme" });
    expect(result).toEqual({ id: 10, slug: "acme", name: "Acme" });
  });
});

describe("UC-WS-06 — deleteWorkspace", () => {
  it("UT-06: calls softDelete with workspaceId and the deleter's userId", async () => {
    wsRepo.findById.mockResolvedValue({
      id: 10,
      publicId: "PUB10",
      name: "Demo",
      deletedAt: null,
    });
    wsRepo.softDelete.mockResolvedValue({ id: 10, deletedAt: new Date() });

    await workspaceService.deleteWorkspace(10, "U1");

    expect(wsRepo.softDelete).toHaveBeenCalledWith(10, "U1");
  });
});
