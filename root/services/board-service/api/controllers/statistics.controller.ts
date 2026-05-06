import { Request, Response } from "express";
import {
  getActivities,
  getMetrics,
  getPriorities,
  getWorkloads,
} from "../../services/statistics.service";

function parseRange(value?: string) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseWorkspaceId(value?: string) {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export class StatisticsController {
  async metrics(req: Request, res: Response) {
    const from = parseRange(req.query.from as string | undefined);
    const to = parseRange(req.query.to as string | undefined);
    if (!from || !to) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid date range",
        },
      });
    }

    const workspaceId = parseWorkspaceId(req.query.workspaceId as string | undefined);

    try {
      const data = await getMetrics({ from, to, workspaceId });
      return res.json({ data });
    } catch (error) {
      console.error("Metrics fetch failed", error);
      return res.status(500).json({
        error: {
          code: "STATISTICS_ERROR",
          message: "Failed to fetch metrics",
        },
      });
    }
  }

  async activities(req: Request, res: Response) {
    const from = parseRange(req.query.from as string | undefined);
    const to = parseRange(req.query.to as string | undefined);
    if (!from || !to) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid date range",
        },
      });
    }

    const workspaceId = parseWorkspaceId(req.query.workspaceId as string | undefined);
    const limit = Number(req.query.limit) || 6;

    try {
      const data = await getActivities({ from, to, workspaceId }, limit);
      return res.json({ data });
    } catch (error) {
      console.error("Activities fetch failed", error);
      return res.status(500).json({
        error: {
          code: "STATISTICS_ERROR",
          message: "Failed to fetch activities",
        },
      });
    }
  }

  async priorities(req: Request, res: Response) {
    const from = parseRange(req.query.from as string | undefined);
    const to = parseRange(req.query.to as string | undefined);
    if (!from || !to) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid date range",
        },
      });
    }

    const workspaceId = parseWorkspaceId(req.query.workspaceId as string | undefined);
    const limit = Number(req.query.limit) || 3;

    try {
      const data = await getPriorities({ from, to, workspaceId }, limit);
      return res.json({ data });
    } catch (error) {
      console.error("Priorities fetch failed", error);
      return res.status(500).json({
        error: {
          code: "STATISTICS_ERROR",
          message: "Failed to fetch priorities",
        },
      });
    }
  }

  async workloads(req: Request, res: Response) {
    const from = parseRange(req.query.from as string | undefined);
    const to = parseRange(req.query.to as string | undefined);
    if (!from || !to) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid date range",
        },
      });
    }

    const workspaceId = parseWorkspaceId(req.query.workspaceId as string | undefined);
    const limit = Number(req.query.limit) || 6;

    try {
      const data = await getWorkloads({ from, to, workspaceId }, limit);
      return res.json({ data });
    } catch (error) {
      console.error("Workloads fetch failed", error);
      return res.status(500).json({
        error: {
          code: "STATISTICS_ERROR",
          message: "Failed to fetch workloads",
        },
      });
    }
  }
}

export const statisticsController = new StatisticsController();
