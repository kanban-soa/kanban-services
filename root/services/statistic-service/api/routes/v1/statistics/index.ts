import { Router, type Response, type Request } from "express";
import { z } from "zod";
import { getStatistics, getSelfPerformance } from "../../../../services/statistics";
import { exportStatistics } from "../../../../services/export";
import { getWorkspaceActivities } from "../../../../services/activity";
import type { AuthenticatedRequest } from "../../../../middleware/auth";

const paramsSchema = z.object({
  workspaceId: z.string().min(1),
});

const querySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).optional(),
  boardId: z.string().optional(),
});

const exportQuerySchema = querySchema.extend({
  format: z.enum(["csv", "json"]).optional().default("csv"),
});

const activitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  actionType: z.string().min(1).optional(),
  entityType: z.string().min(1).optional(),
  actorUserId: z.string().min(1).optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
});

type StatisticsQuery = z.infer<typeof querySchema>;
type ExportStatisticsQuery = z.infer<typeof exportQuerySchema>;
type ActivitiesQuery = z.infer<typeof activitiesQuerySchema>;
type StatisticsParams = z.infer<typeof paramsSchema>;

export const statisticsRoutes = Router();

statisticsRoutes.get("/:workspaceId/export", async (req: AuthenticatedRequest, res: Response) => {
  const paramsParsed = paramsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid path parameters",
        details: paramsParsed.error.flatten(),
      },
    });
  }

  const queryParsed = exportQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: queryParsed.error.flatten(),
      },
    });
  }

  try {
    await exportStatistics(
      res,
      {
        ...(queryParsed.data as ExportStatisticsQuery),
        workspaceId: (paramsParsed.data as StatisticsParams).workspaceId,
      },
      {
        authorization: req.headers.authorization,
        requestId: req.headers["x-request-id"] as string | undefined,
        user: req.user,
      },
    );
  } catch (error) {
    console.error("Statistics export failed", error);
    return res.status(500).json({
      error: {
        code: "STATISTICS_ERROR",
        message: "Failed to export statistics",
      },
    });
  }
});

statisticsRoutes.get("/:workspaceId/activities", async (req: AuthenticatedRequest, res: Response) => {
  const paramsParsed = paramsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid path parameters",
        details: paramsParsed.error.flatten(),
      },
    });
  }

  const queryParsed = activitiesQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: queryParsed.error.flatten(),
      },
    });
  }

  try {
    const data = await getWorkspaceActivities(
      {
        ...(queryParsed.data as ActivitiesQuery),
        workspaceId: (paramsParsed.data as StatisticsParams).workspaceId,
      },
      {
        authorization: req.headers.authorization,
        requestId: req.headers["x-request-id"] as string | undefined,
        user: req.user,
      },
    );

    return res.json({ data });
  } catch (error) {
    console.error("Activity fetch failed", error);
    return res.status(500).json({
      error: {
        code: "ACTIVITY_ERROR",
        message: "Failed to fetch activities",
      },
    });
  }
});

statisticsRoutes.get("/:workspaceId", async (req: AuthenticatedRequest, res: Response) => {
  const paramsParsed = paramsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid path parameters",
        details: paramsParsed.error.flatten(),
      },
    });
  }

  const queryParsed = querySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: queryParsed.error.flatten(),
      },
    });
  }

  try {
    const data = await getStatistics(
      {
        ...(queryParsed.data as StatisticsQuery),
        workspaceId: (paramsParsed.data as StatisticsParams).workspaceId,
      },
      {
        authorization: req.headers.authorization,
        requestId: req.headers["x-request-id"] as string | undefined,
        user: req.user,
      },
    );
    return res.json({ data });
  } catch (error) {
    console.error("Statistics fetch failed", error);
    return res.status(500).json({
      error: {
        code: "STATISTICS_ERROR",
        message: "Failed to fetch statistics",
      },
    });
  }
});

statisticsRoutes.get("/:workspaceId/self-performance", async (req: AuthenticatedRequest, res: Response) => {
  const paramsParsed = paramsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid path parameters",
        details: paramsParsed.error.flatten(),
      },
    });
  }

  const queryParsed = querySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: queryParsed.error.flatten(),
      },
    });
  }

  try {
    const data = await getSelfPerformance(
      {
        ...(queryParsed.data as StatisticsQuery),
        workspaceId: (paramsParsed.data as StatisticsParams).workspaceId,
      },
      {
        authorization: req.headers.authorization,
        requestId: req.headers["x-request-id"] as string | undefined,
        user: req.user,
      },
    );
    return res.json({ data });
  } catch (error) {
    console.error("Self performance fetch failed", error);
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this resource.",
        },
      });
    }
    return res.status(500).json({
      error: {
        code: "STATISTICS_ERROR",
        message: "Failed to fetch self performance statistics",
      },
    });
  }
});
