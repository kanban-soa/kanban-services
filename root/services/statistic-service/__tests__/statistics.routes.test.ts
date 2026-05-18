import express, { type Response } from "express";
import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as exportService from "../services/export";
import * as service from "../services/statistics";

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
});

describe("statistics export routes", () => {
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
