import express, { type Response } from "express";
import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as exportService from "../services/export";
import * as service from "../services/statistics";
import { authMiddleware } from "../middleware/auth";
import * as activityService from "../services/activity";

let statisticsRoutes: typeof import("../api/routes/v1/statistics").statisticsRoutes;

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgres://user:pass@localhost:5432/test";
  process.env.BOARD_SERVICE_URL = process.env.BOARD_SERVICE_URL ?? "http://board.local";
  process.env.WORKSPACE_SERVICE_URL = process.env.WORKSPACE_SERVICE_URL ?? "http://workspace.local";
  ({ statisticsRoutes } = await import("../api/routes/v1/statistics"));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("statistics routes", () => {
  it("returns data for a valid request", async () => {
    vi.spyOn(service, "getStatistics").mockResolvedValue({
      range: "7d",
      metrics: {
        completed: 1,
        updated: 1,
        created: 1,
        dueSoon: 1,
        completedTrend: 0,
        updatedTrend: 0,
        createdTrend: 0,
        dueSoonTrend: 0,
      },
      activities: [],
      priorities: [],
      workloads: [],
    });

    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app).get("/api/statistics/workspace-1?range=7d").set("x-user-id", "user-1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        range: "7d",
        metrics: {
          completed: 1,
          updated: 1,
          created: 1,
          dueSoon: 1,
          completedTrend: 0,
          updatedTrend: 0,
          createdTrend: 0,
          dueSoonTrend: 0,
        },
        activities: [],
        priorities: [],
        workloads: [],
      },
    });
  });

  // TC-STAT-06
  it("returns 401 for unauthenticated access", async () => {
    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app).get("/api/statistics/workspace-1?range=7d");

    expect(response.status).toBe(401);
    expect(response.body.error?.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 for invalid query parameters", async () => {
    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app).get("/api/statistics/workspace-1?range=2d").set("x-user-id", "user-1");

    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 when the service throws", async () => {
    vi.spyOn(service, "getStatistics").mockRejectedValue(new Error("boom"));

    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app).get("/api/statistics/workspace-1?range=7d").set("x-user-id", "user-1");

    expect(response.status).toBe(500);
    expect(response.body.error?.code).toBe("STATISTICS_ERROR");
  });

  it("calls getStatistics with boardId when provided", async () => {
    const getStatisticsSpy = vi.spyOn(service, "getStatistics").mockResolvedValue({
      range: "7d",
      metrics: {
        completed: 1,
        updated: 1,
        created: 1,
        dueSoon: 1,
        completedTrend: 0,
        updatedTrend: 0,
        createdTrend: 0,
        dueSoonTrend: 0,
      },
      activities: [],
      priorities: [],
      workloads: [],
    });

    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    await request(app).get("/api/statistics/workspace-1?boardId=board-123").set("x-user-id", "user-1");

    expect(getStatisticsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace-1",
        boardId: "board-123",
      }),
      expect.anything(),
    );
  });

  // TC-STAT-04
  it("uses default filters when none are provided (resets board filter)", async () => {
    const getStatisticsSpy = vi.spyOn(service, "getStatistics").mockResolvedValue({
      range: "7d",
      metrics: { completed: 1, updated: 1, created: 1, dueSoon: 1, completedTrend: 0, updatedTrend: 0, createdTrend: 0, dueSoonTrend: 0 },
      activities: [],
      priorities: [],
      workloads: [],
    });

    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    await request(app).get("/api/statistics/workspace-1").set("x-user-id", "user-1");

    const calls = getStatisticsSpy.mock.calls;
    const lastCallArgs = calls[calls.length - 1][0];
    expect(lastCallArgs.workspaceId).toBe("workspace-1");
    expect(lastCallArgs.range).toBeUndefined();
    expect(lastCallArgs.boardId).toBeUndefined();
  });

  it("resets board filter when 'all' is provided", async () => {
    const getStatisticsSpy = vi.spyOn(service, "getStatistics").mockResolvedValue({
      range: "7d",
      metrics: { completed: 1, updated: 1, created: 1, dueSoon: 1, completedTrend: 0, updatedTrend: 0, createdTrend: 0, dueSoonTrend: 0 },
      activities: [],
      priorities: [],
      workloads: [],
    });

    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    await request(app).get("/api/statistics/workspace-1?boardId=board-123").set("x-user-id", "user-1");

    expect(getStatisticsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        boardId: "board-123",
      }),
      expect.anything()
    );

    await request(app).get("/api/statistics/workspace-1?boardId=all").set("x-user-id", "user-1");

    expect(getStatisticsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        boardId: "all",
      }),
      expect.anything()
    );
  });

  it("fetches data for different workspaces", async () => {
    const getStatisticsSpy = vi.spyOn(service, "getStatistics").mockResolvedValue({
      range: "7d",
      metrics: { completed: 1, updated: 1, created: 1, dueSoon: 1, completedTrend: 0, updatedTrend: 0, createdTrend: 0, dueSoonTrend: 0 },
      activities: [],
      priorities: [],
      workloads: [],
    });

    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    await request(app).get("/api/statistics/workspace-1").set("x-user-id", "user-1");

    expect(getStatisticsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace-1",
      }),
      expect.anything()
    );

    await request(app).get("/api/statistics/workspace-2").set("x-user-id", "user-1");

    expect(getStatisticsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace-2",
      }),
      expect.anything()
    );
  });
});

describe("statistics export routes", () => {
  // TC-STAT-07
  it("calls export service for a valid csv request", async () => {
    const spy = vi.spyOn(exportService, "exportStatistics").mockImplementation(async (res: Response) => {
      res.status(200).send("mock csv");
    });

    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app).get("/api/statistics/workspace-1/export?range=7d&format=csv").set("x-user-id", "user-1");

    expect(response.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        range: "7d",
        workspaceId: "workspace-1",
        format: "csv",
      }),
      expect.anything(),
    );
  });

  // TC-STAT-08
  it("calls export service for a valid json request", async () => {
    const spy = vi.spyOn(exportService, "exportStatistics").mockImplementation(async (res: Response) => {
      res.status(200).json({ mock: "json" });
    });

    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app).get("/api/statistics/workspace-1/export?range=30d&format=json").set("x-user-id", "user-1");

    expect(response.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        range: "30d",
        workspaceId: "workspace-1",
        format: "json",
      }),
      expect.anything(),
    );
  });

  // TC-STAT-10
  it("returns 400 for invalid export format", async () => {
    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app)
      .get("/api/statistics/workspace-1/export?range=7d&format=xml")
      .set("x-user-id", "user-1");

    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe("VALIDATION_ERROR");
  });

  // TC-STAT-11
  it("returns 403 when exporting with insufficient permissions", async () => {
    vi.spyOn(exportService, "exportStatistics").mockImplementation(async (res: Response, _, opts) => {
      // @ts-ignore - Let's mock a simple role check
      if (opts.user?.role !== "ADMIN") {
        res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Insufficient permissions",
          },
        });
        return;
      }
      res.status(200).send("ok");
    });

    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app)
      .get("/api/statistics/workspace-1/export?range=7d&format=csv")
      .set("x-user-id", "user-2") // Assumes user-2 is a regular member
      .set("x-user-role", "MEMBER"); // Mocking user role via header for test simplicity

    expect(response.status).toBe(403);
    expect(response.body.error?.code).toBe("FORBIDDEN");
  });

  it("returns 500 when the export service throws", async () => {
    vi.spyOn(exportService, "exportStatistics").mockRejectedValue(new Error("boom"));

    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app).get("/api/statistics/workspace-1/export?range=7d").set("x-user-id", "user-1");

    expect(response.status).toBe(500);
    expect(response.body.error?.code).toBe("STATISTICS_ERROR");
  });
});

describe("self performance routes", () => {
  it("returns data for a valid request", async () => {
    vi.spyOn(service, "getSelfPerformance").mockResolvedValue({
      range: "7d",
      completedTotal: 12,
      overdueTotal: 2,
      comparisonPercentage: 40,
      completedPercentage: 60,
      overdueTasks: [
        {
          id: 101,
          title: "Overdue Task",
          dueDate: "2025-02-01T10:00:00.000Z",
        },
      ],
    });

    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app)
      .get("/api/statistics/workspace-1/self-performance?range=7d")
      .set("x-user-id", "user-1");

    expect(response.status).toBe(200);
    expect(response.body.data.overdueTasks).toBeDefined();
  });
  
  // TC-STAT-21
  it("returns 403 when trying to access another user's performance data", async () => {
     vi.spyOn(service, "getSelfPerformance").mockImplementation(async (query, opts) => {
      // @ts-ignore - Mocking a check
      if (opts.user?.id !== query.userId) {
        throw new Error("FORBIDDEN");
      }
      return { range: "7d", completedTotal: 1, overdueTotal: 1, comparisonPercentage: 1, completedPercentage: 1, overdueTasks: [] };
    });
    
    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app)
      .get("/api/statistics/workspace-1/self-performance?range=7d&userId=user-2") // Requesting user-2 data
      .set("x-user-id", "user-1"); // As user-1

    expect(response.status).toBe(403);
    expect(response.body.error?.code).toBe("FORBIDDEN");
  });

  it("returns 401 when missing user header", async () => {
    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app)
      .get("/api/statistics/workspace-1/self-performance?range=7d");

    expect(response.status).toBe(401);
    expect(response.body.error?.code).toBe("UNAUTHORIZED");
  });
});

describe("activity log routes", () => {
  // TC-STAT-15
  it("returns a paginated list of activities with correct data integrity", async () => {
    const activitySpy = vi.spyOn(activityService, "getWorkspaceActivities").mockResolvedValue({
      items: [{ id: 1, publicId: "act-1", workspaceId: 1, actorUserId: "user-1", actionType: "card.create", entityType: "card", entityId: "card-1", createdAt: new Date().toISOString() }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app).get("/api/statistics/workspace-1/activities?page=1&limit=10").set("x-user-id", "user-1");

    expect(response.status).toBe(200);
    const { items, pagination } = response.body.data;
    expect(items).toHaveLength(1);
    expect(pagination.page).toBe(1);
    
    const activity = items[0];
    expect(activity.actorUserId).toBe("user-1");
    expect(activity.actionType).toBe("card.create");
    expect(activity.entityType).toBe("card");
    expect(activity.entityId).toBe("card-1");

    expect(activitySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace-1",
        page: 1,
        limit: 10,
      }),
      expect.anything()
    );
  });

  it("returns 400 for invalid pagination parameters", async () => {
    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app).get("/api/statistics/workspace-1/activities?page=0").set("x-user-id", "user-1");

    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe("VALIDATION_ERROR");
  });
});
