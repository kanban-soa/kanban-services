import { getStatistics } from "./statistics";
import { format } from "fast-csv";
import type { Response } from "express";
import type { StatisticsRange } from "../types/statistics";

export async function exportStatistics(
  res: Response,
  query: { range?: StatisticsRange; workspaceId?: string; format?: "csv" | "json" },
  context: {
    authorization?: string;
    requestId?: string;
    user?: { id?: string; email?: string; role?: string };
  },
) {
  const data = await getStatistics(query, context);

  if (query.format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="statistics.csv"`);
    
    // Create a fast-csv stream that writes to the response
    const csvStream = format({ headers: false });
    csvStream.pipe(res);

    // --- Metrics Section ---
    csvStream.write(["--- METRICS ---"]);
    csvStream.write(["Category", "Value", "Trend (%)"]);
    for (const [key, value] of Object.entries(data.metrics)) {
      if (key.endsWith("Trend")) {
        continue;
      }
      // Assuming metrics like `completedTrend` map to `completed`
      const trendValue = data.metrics[`${key}Trend` as keyof typeof data.metrics] ?? "N/A";
      csvStream.write([key, value, trendValue]);
    }
    csvStream.write([]); // Empty row for spacing

    // --- Activities Section ---
    csvStream.write(["--- RECENT ACTIVITIES ---"]);
    if (data.activities && data.activities.length > 0) {
      csvStream.write(["User", "Action", "Target", "Team", "Status", "Time"]);
      for (const activity of data.activities) {
        csvStream.write([
          activity.user,
          activity.action,
          activity.target,
          activity.team,
          activity.status,
          activity.time,
        ]);
      }
    } else {
      csvStream.write(["No activities found"]);
    }
    csvStream.write([]); // Empty row for spacing

    // --- Priorities Section ---
    csvStream.write(["--- PRIORITIES ---"]);
    if (data.priorities && data.priorities.length > 0) {
      csvStream.write(["Label", "Value (%)", "Color"]);
      for (const priority of data.priorities) {
        csvStream.write([priority.label, priority.value, priority.color]);
      }
    } else {
      csvStream.write(["No priorities found"]);
    }
    csvStream.write([]); // Empty row for spacing

    // --- Workloads Section ---
    csvStream.write(["--- WORKLOADS ---"]);
    if (data.workloads && data.workloads.length > 0) {
      csvStream.write(["Name", "Capacity (%)", "State"]);
      for (const workload of data.workloads) {
        csvStream.write([workload.name, workload.capacity, workload.state]);
      }
    } else {
      csvStream.write(["No workloads found"]);
    }

    // End the stream
    csvStream.end();
  } else {
    // JSON format
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="statistics.json"`);
    res.send(data);
  }
}
