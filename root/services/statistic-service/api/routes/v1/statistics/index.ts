import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { getStatistics } from "../../../../services/statistics";
import { exportStatistics } from "../../../../services/export";

const paramsSchema = z.object({
  workspaceId: z.string().min(1),
});

const querySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).optional(),
});

const exportQuerySchema = querySchema.extend({
  format: z.enum(["csv", "json"]).optional().default("csv"),
});

type StatisticsQuery = z.infer<typeof querySchema>;
type ExportStatisticsQuery = z.infer<typeof exportQuerySchema>;
type StatisticsParams = z.infer<typeof paramsSchema>;

export const statisticsRoutes = Router();

statisticsRoutes.get("/:workspaceId/export", async (req: Request, res: Response) => {
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
        user: (req as { user?: { id?: string; email?: string; role?: string } }).user,
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

statisticsRoutes.get("/:workspaceId", async (req: Request, res: Response) => {
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
        user: (req as { user?: { id?: string; email?: string; role?: string } }).user,
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
