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
  // TC-STAT-02
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
    app.use("/statistics", statisticsRoutes);

    const response = await request(app).get("/statistics/workspace-1?range=7d");

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

  it("returns 400 for invalid query parameters", async () => {
    const app = express();
    app.use("/statistics", statisticsRoutes);

    const response = await request(app).get("/statistics/workspace-1?range=2d");

    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 when the service throws", async () => {
    vi.spyOn(service, "getStatistics").mockRejectedValue(new Error("boom"));

    const app = express();
    app.use("/statistics", statisticsRoutes);

    const response = await request(app).get("/statistics/workspace-1?range=7d");

    expect(response.status).toBe(500);
    expect(response.body.error?.code).toBe("STATISTICS_ERROR");
  });

  // TC-STAT-03
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
    app.use("/statistics", statisticsRoutes);

    await request(app).get("/statistics/workspace-1?boardId=board-123");

    expect(getStatisticsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace-1",
        boardId: "board-123",
      }),
      expect.anything(),
    );
  });

  // TC-STAT-01
  it("uses default filters when none are provided", async () => {
    const getStatisticsSpy = vi.spyOn(service, "getStatistics").mockResolvedValue({
      range: "7d",
      metrics: { completed: 1, updated: 1, created: 1, dueSoon: 1, completedTrend: 0, updatedTrend: 0, createdTrend: 0, dueSoonTrend: 0 },
      activities: [],
      priorities: [],
      workloads: [],
    });

    const app = express();
    app.use("/statistics", statisticsRoutes);

    await request(app).get("/statistics/workspace-1");

    const calls = getStatisticsSpy.mock.calls;
    const lastCallArgs = calls[calls.length - 1][0];
    expect(lastCallArgs.workspaceId).toBe("workspace-1");
    expect(lastCallArgs.range).toBeUndefined();
    expect(lastCallArgs.boardId).toBeUndefined();
  });

  // TC-STAT-04
  it("resets board filter when 'all' is provided", async () => {
    const getStatisticsSpy = vi.spyOn(service, "getStatistics").mockResolvedValue({
      range: "7d",
      metrics: { completed: 1, updated: 1, created: 1, dueSoon: 1, completedTrend: 0, updatedTrend: 0, createdTrend: 0, dueSoonTrend: 0 },
      activities: [],
      priorities: [],
      workloads: [],
    });

    const app = express();
    app.use("/statistics", statisticsRoutes);

    await request(app).get("/statistics/workspace-1?boardId=board-123");

    expect(getStatisticsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        boardId: "board-123",
      }),
      expect.anything()
    );

    await request(app).get("/statistics/workspace-1?boardId=all");

    expect(getStatisticsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        boardId: "all",
      }),
      expect.anything()
    );
  });

  // TC-STAT-05
  it("fetches data for different workspaces", async () => {
    const getStatisticsSpy = vi.spyOn(service, "getStatistics").mockResolvedValue({
      range: "7d",
      metrics: { completed: 1, updated: 1, created: 1, dueSoon: 1, completedTrend: 0, updatedTrend: 0, createdTrend: 0, dueSoonTrend: 0 },
      activities: [],
      priorities: [],
      workloads: [],
    });

    const app = express();
    app.use("/statistics", statisticsRoutes);

    await request(app).get("/statistics/workspace-1");

    expect(getStatisticsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace-1",
      }),
      expect.anything()
    );

    await request(app).get("/statistics/workspace-2");

    expect(getStatisticsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace-2",
      }),
      expect.anything()
    );
  });
});

describe("statistics export routes", () => {
  // TC-STAT-06
  it("calls export service for a valid csv request", async () => {
    const spy = vi.spyOn(exportService, "exportStatistics").mockImplementation(async (res: Response) => {
      res.status(200).send("mock csv");
    });

    const app = express();
    app.use("/statistics", statisticsRoutes);

    const response = await request(app).get("/statistics/workspace-1/export?range=7d&format=csv");

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

  // TC-STAT-07
  it("calls export service for a valid json request", async () => {
    const spy = vi.spyOn(exportService, "exportStatistics").mockImplementation(async (res: Response) => {
      res.status(200).json({ mock: "json" });
    });

    const app = express();
    app.use("/statistics", statisticsRoutes);

    const response = await request(app).get("/statistics/workspace-1/export?range=30d&format=json");

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

  it("returns 400 for invalid export query parameters", async () => {
    const app = express();
    app.use("/statistics", statisticsRoutes);

    const response = await request(app).get("/statistics/workspace-1/export?range=2d");

    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 when the export service throws", async () => {
    vi.spyOn(exportService, "exportStatistics").mockRejectedValue(new Error("boom"));

    const app = express();
    app.use("/statistics", statisticsRoutes);

    const response = await request(app).get("/statistics/workspace-1/export?range=7d");

    expect(response.status).toBe(500);
    expect(response.body.error?.code).toBe("STATISTICS_ERROR");
  });
});

describe("self performance routes", () => {
  // TC-STAT-11, TC-STAT-12
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
    expect(response.body).toEqual({
      data: {
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
      },
    });
  });

  // TC-STAT-12
  it("returns overdue tasks when they exist", async () => {
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
    expect(response.body.data.overdueTasks).toHaveLength(1);
    expect(response.body.data.overdueTasks[0].title).toBe("Overdue Task");
  });

  // TC-STAT-13
  it("returns an empty array when no overdue tasks exist", async () => {
    vi.spyOn(service, "getSelfPerformance").mockResolvedValue({
      range: "30d",
      completedTotal: 10,
      overdueTotal: 0,
      comparisonPercentage: 50,
      completedPercentage: 100,
      overdueTasks: [],
    });

    const app = express();
    app.use("/api/statistics", authMiddleware, statisticsRoutes);

    const response = await request(app)
      .get("/api/statistics/workspace-1/self-performance?range=30d")
      .set("x-user-id", "user-1");

    expect(response.status).toBe(200);
    expect(response.body.data.overdueTasks).toEqual([]);
    expect(response.body.data.overdueTotal).toBe(0);
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
  // TC-STAT-08, TC-STAT-09
  it("returns a paginated list of activities", async () => {
    const activitySpy = vi.spyOn(activityService, "getWorkspaceActivities").mockResolvedValue({
      items: [{ id: 1, publicId: "act-1", workspaceId: 1, actorUserId: "user-1", actionType: "card.create", entityType: "card", entityId: "card-1", createdAt: new Date().toISOString() }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    const app = express();
    app.use("/statistics", statisticsRoutes);

    const response = await request(app).get("/statistics/workspace-1/activities?page=1&limit=10");

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.pagination.page).toBe(1);

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
    app.use("/statistics", statisticsRoutes);

    const response = await request(app).get("/statistics/workspace-1/activities?page=0");

    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe("VALIDATION_ERROR");
  });
});
