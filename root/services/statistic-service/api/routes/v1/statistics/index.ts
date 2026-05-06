import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { getStatistics } from "../../../../services/statistics";

const querySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).optional(),
  workspaceId: z.string().optional(),
});

type StatisticsQuery = z.infer<typeof querySchema>;

export const statisticsRoutes = Router();

statisticsRoutes.get("/", async (req: Request, res: Response) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: parsed.error.flatten(),
      },
    });
  }

  try {
    const data = await getStatistics(parsed.data as StatisticsQuery, {
      authorization: req.headers.authorization,
      requestId: req.headers["x-request-id"] as string | undefined,
      user: (req as { user?: { id?: string; email?: string; role?: string } }).user,
    });
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
