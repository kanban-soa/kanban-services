import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { getStatistics } from "../../../../services/statistics";

let cachedDb: typeof import("../../../../config/database") | null = null;

async function getDb() {
  if (!cachedDb) {
    cachedDb = await import("../../../../config/database");
  }
  return cachedDb.db;
}

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
    const db = await getDb();
    const data = await getStatistics(db, parsed.data as StatisticsQuery);
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
