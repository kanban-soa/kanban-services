import type { Database } from "../config/database";
import {
  fetchMetrics,
  fetchPriorityBreakdown,
  fetchRecentActivities,
  fetchWorkloads,
  type StatisticsFilter,
} from "../repositories/statistics";
import type {
  StatisticsRange,
  StatisticsResponse,
  StatisticPriority,
  StatisticWorkload,
} from "../types/statistics";

const rangeDays: Record<StatisticsRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function parseRange(value?: string): StatisticsRange {
  if (value === "30d" || value === "90d") {
    return value;
  }
  return "7d";
}

function buildRange(range: StatisticsRange): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);
  from.setDate(from.getDate() - rangeDays[range]);
  return { from, to };
}

function buildTrend(current: number, previous: number): number {
  if (previous === 0 && current === 0) {
    return 0;
  }
  if (previous === 0) {
    return 100;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function workloadState(capacity: number): string {
  if (capacity >= 90) {
    return "Overload";
  }
  if (capacity >= 70) {
    return "High Load";
  }
  if (capacity >= 40) {
    return "Optimal";
  }
  return "Available";
}

function normalizePriorities(priorities: StatisticPriority[]): StatisticPriority[] {
  if (priorities.length === 0) {
    return [
      { label: "Urgent", value: 0, color: "#ef4444" },
      { label: "High Priority", value: 0, color: "#6366f1" },
      { label: "Normal", value: 0, color: "#a5b4fc" },
    ];
  }
  return priorities;
}

export async function getStatistics(
  db: Database,
  query: { range?: string; workspaceId?: string },
): Promise<StatisticsResponse> {
  const range = parseRange(query.range);
  const { from, to } = buildRange(range);
  const prevRange = {
    to: new Date(from),
    from: new Date(from),
  };
  prevRange.from.setDate(prevRange.from.getDate() - rangeDays[range]);

  const workspaceId = query.workspaceId ? Number(query.workspaceId) : undefined;

  const filter: StatisticsFilter = { from, to, workspaceId };
  const prevFilter: StatisticsFilter = { from: prevRange.from, to: prevRange.to, workspaceId };

  const [metrics, prevMetrics, activities, prioritiesRows, workloadsRows] = await Promise.all([
    fetchMetrics(db, filter),
    fetchMetrics(db, prevFilter),
    fetchRecentActivities(db, filter),
    fetchPriorityBreakdown(db, filter),
    fetchWorkloads(db, filter),
  ]);

  const priorities: StatisticPriority[] = prioritiesRows.map((row) => ({
    label: row.label,
    value: row.total ? Math.round((row.count / row.total) * 100) : 0,
    color: row.color ?? "#6366f1",
  }));

  const workloads: StatisticWorkload[] = workloadsRows.map((row) => {
    const capacity = Math.min(100, Math.round((row.assignedCount / 20) * 100));
    return {
      name: row.name,
      capacity,
      state: workloadState(capacity),
    };
  });

  return {
    range,
    metrics: {
      completed: metrics.completed,
      updated: metrics.updated,
      created: metrics.created,
      dueSoon: metrics.dueSoon,
      completedTrend: buildTrend(metrics.completed, prevMetrics.completed),
      updatedTrend: buildTrend(metrics.updated, prevMetrics.updated),
      createdTrend: buildTrend(metrics.created, prevMetrics.created),
      dueSoonTrend: buildTrend(metrics.dueSoon, prevMetrics.dueSoon),
    },
    activities: activities.map((activity) => {
      const rawTime = activity.time;
      const timeValue = rawTime instanceof Date ? rawTime : new Date(rawTime as string | number);
      const time = Number.isNaN(timeValue.getTime()) ? String(rawTime ?? "") : timeValue.toDateString();

      return {
        user: activity.user,
        action: activity.action,
        target: activity.target,
        time,
        team: activity.team ?? "Team",
        status: activity.status,
      };
    }),
    priorities: normalizePriorities(priorities),
    workloads,
  };
}
