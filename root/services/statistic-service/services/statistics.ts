import { createServiceClient } from "../../../common/utils/service-client";
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

type ServiceContext = {
  authorization?: string;
  requestId?: string;
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
};

type BoardMetrics = {
  completed: number;
  updated: number;
  created: number;
  dueSoon: number;
};

type BoardActivity = {
  workspaceMemberId?: number | null;
  action: string;
  target: string;
  time: string | Date;
  team: string | null;
  status: string;
};

type BoardPriorityRow = {
  label: string;
  count: number;
  color: string | null;
  total: number;
};

type BoardWorkloadRow = {
  workspaceMemberId?: number | null;
  assignedCount: number;
};

type MemberSummary = {
  id: number;
  email: string;
  userId?: string | null;
};

function requireServiceUrl(name: "BOARD_SERVICE_URL" | "WORKSPACE_SERVICE_URL"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function buildAuthHeaders(context?: ServiceContext): Record<string, string> {
  if (!context?.authorization) {
    return {};
  }
  return { authorization: context.authorization };
}

let cachedBoardClient: ReturnType<typeof createServiceClient> | null = null;
let cachedWorkspaceClient: ReturnType<typeof createServiceClient> | null = null;

function getBoardClient() {
  if (!cachedBoardClient) {
    cachedBoardClient = createServiceClient({
      baseUrl: requireServiceUrl("BOARD_SERVICE_URL"),
      timeoutMs: 8000,
    });
  }
  return cachedBoardClient;
}

function getWorkspaceClient() {
  if (!cachedWorkspaceClient) {
    cachedWorkspaceClient = createServiceClient({
      baseUrl: requireServiceUrl("WORKSPACE_SERVICE_URL"),
      timeoutMs: 8000,
    });
  }
  return cachedWorkspaceClient;
}

async function fetchBoardMetrics(
  filter: { from: Date; to: Date; workspaceId?: number },
  context?: ServiceContext,
): Promise<BoardMetrics> {
  const response = await getBoardClient().requestJson<{ data: BoardMetrics }>({
    method: "GET",
    path: "/api/internal/statistics/metrics",
    query: {
      from: filter.from.toISOString(),
      to: filter.to.toISOString(),
      workspaceId: filter.workspaceId,
    },
    headers: buildAuthHeaders(context),
    context,
  });

  return response.data.data;
}

async function fetchBoardActivities(
  filter: { from: Date; to: Date; workspaceId?: number },
  context?: ServiceContext,
): Promise<BoardActivity[]> {
  const response = await getBoardClient().requestJson<{ data: BoardActivity[] }>({
    method: "GET",
    path: "/api/internal/statistics/activities",
    query: {
      from: filter.from.toISOString(),
      to: filter.to.toISOString(),
      workspaceId: filter.workspaceId,
      limit: 6,
    },
    headers: buildAuthHeaders(context),
    context,
  });

  return response.data.data;
}

async function fetchBoardPriorities(
  filter: { from: Date; to: Date; workspaceId?: number },
  context?: ServiceContext,
): Promise<BoardPriorityRow[]> {
  const response = await getBoardClient().requestJson<{ data: BoardPriorityRow[] }>({
    method: "GET",
    path: "/api/internal/statistics/priorities",
    query: {
      from: filter.from.toISOString(),
      to: filter.to.toISOString(),
      workspaceId: filter.workspaceId,
      limit: 3,
    },
    headers: buildAuthHeaders(context),
    context,
  });

  return response.data.data;
}

async function fetchBoardWorkloads(
  filter: { from: Date; to: Date; workspaceId?: number },
  context?: ServiceContext,
): Promise<BoardWorkloadRow[]> {
  const response = await getBoardClient().requestJson<{ data: BoardWorkloadRow[] }>({
    method: "GET",
    path: "/api/internal/statistics/workloads",
    query: {
      from: filter.from.toISOString(),
      to: filter.to.toISOString(),
      workspaceId: filter.workspaceId,
      limit: 6,
    },
    headers: buildAuthHeaders(context),
    context,
  });

  return response.data.data;
}

async function fetchMemberSummaries(
  workspaceId: number | undefined,
  memberIds: number[],
  context?: ServiceContext,
): Promise<Map<number, MemberSummary>> {
  if (!workspaceId || memberIds.length === 0) {
    return new Map();
  }

  const response = await getWorkspaceClient().requestJson<{ data: { members: MemberSummary[] } }>({
    method: "POST",
    path: `/api/workspaces/${workspaceId}/members/summary`,
    body: { ids: memberIds },
    headers: buildAuthHeaders(context),
    context,
  });

  const members = response.data.data.members ?? [];
  return new Map(members.map((member) => [member.id, member]));
}

export async function getStatistics(
  query: { range?: string; workspaceId?: string },
  context?: ServiceContext,
): Promise<StatisticsResponse> {
  const range = parseRange(query.range);
  const { from, to } = buildRange(range);
  const prevRange = {
    to: new Date(from),
    from: new Date(from),
  };
  prevRange.from.setDate(prevRange.from.getDate() - rangeDays[range]);

  const workspaceId = query.workspaceId ? Number(query.workspaceId) : undefined;

  const filter = { from, to, workspaceId };
  const prevFilter = { from: prevRange.from, to: prevRange.to, workspaceId };

  const [metrics, prevMetrics, activities, prioritiesRows, workloadsRows] = await Promise.all([
    fetchBoardMetrics(filter, context),
    fetchBoardMetrics(prevFilter, context),
    fetchBoardActivities(filter, context),
    fetchBoardPriorities(filter, context),
    fetchBoardWorkloads(filter, context),
  ]);

  const memberIds = Array.from(
    new Set(
      [...activities, ...workloadsRows]
        .map((item) => item.workspaceMemberId)
        .filter((value): value is number => typeof value === "number"),
    ),
  );

  const memberMap = await fetchMemberSummaries(workspaceId, memberIds, context);

  const priorities: StatisticPriority[] = prioritiesRows.map((row) => ({
    label: row.label,
    value: row.total ? Math.round((row.count / row.total) * 100) : 0,
    color: row.color ?? "#6366f1",
  }));

  const workloads: StatisticWorkload[] = workloadsRows.map((row) => {
    const capacity = Math.min(100, Math.round((row.assignedCount / 20) * 100));
    const member = row.workspaceMemberId ? memberMap.get(row.workspaceMemberId) : undefined;
    const name = member?.email ?? "Unknown";
    return {
      name,
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
      const time = Number.isNaN(timeValue.getTime())
        ? String(rawTime ?? "")
        : timeValue.toDateString();
      const member = activity.workspaceMemberId
        ? memberMap.get(activity.workspaceMemberId)
        : undefined;

      return {
        user: member?.email ?? "Unknown",
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
