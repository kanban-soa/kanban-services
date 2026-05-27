import { sql } from "drizzle-orm";
import type { Database } from "../config/database";

export type StatisticsFilter = {
  workspaceId?: number;
  boardId?: string;
  from: Date;
  to: Date;
};

export type MetricsRow = {
  completed: number;
  updated: number;
  created: number;
  dueSoon: number;
};

export type ActivityRow = {
  workspaceMemberId: number | null;
  action: string;
  target: string;
  time: Date;
  team: string | null;
  status: string;
};

export type PriorityRow = {
  label: string;
  count: number;
  color: string | null;
  total: number;
};

export type WorkloadRow = {
  workspaceMemberId: number | null;
  assignedCount: number;
};

export type MemberPerformanceRow = {
  completedTotal: number;
  overdueTotal: number;
  assignedTotal: number;
  teamCompletedTotal: number;
};

export type OverdueTaskRow = {
  id: number;
  title: string;
  dueDate: Date;
};

function unwrapRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }
  if (result && typeof result === "object" && "rows" in result) {
    const rows = (result as { rows?: T[] }).rows;
    return rows ?? [];
  }
  return [];
}

export async function fetchMetrics(db: Database, filter: StatisticsFilter): Promise<MetricsRow> {
  const workspaceFilter = filter.workspaceId
    ? sql`AND b."workspaceId" = ${filter.workspaceId}`
    : sql``;

  const boardFilter = filter.boardId
    ? sql`AND b."publicId" = ${filter.boardId}`
    : sql``;

  const result = await db.execute<MetricsRow>(sql`
    SELECT
      COALESCE(SUM(CASE WHEN ca.type = 'card.archived' THEN 1 ELSE 0 END), 0)::int AS completed,
      COALESCE(SUM(CASE WHEN ca.type::text LIKE 'card.updated.%' THEN 1 ELSE 0 END), 0)::int AS updated,
      COALESCE(SUM(CASE WHEN ca.type = 'card.created' THEN 1 ELSE 0 END), 0)::int AS created,
      COALESCE(SUM(CASE WHEN c."dueDate" IS NOT NULL
        AND c."dueDate" >= ${filter.from}
        AND c."dueDate" <= ${filter.to}
      THEN 1 ELSE 0 END), 0)::int AS "dueSoon"
    FROM card_activity ca
    JOIN card c ON c.id = ca."cardId"
    JOIN list l ON l.id = c."listId"
    JOIN board b ON b.id = l."boardId"
    WHERE ca."createdAt" >= ${filter.from}
      AND ca."createdAt" <= ${filter.to}
      AND b."deletedAt" IS NULL
      AND l."deletedAt" IS NULL
      AND c."deletedAt" IS NULL
      ${workspaceFilter}
      ${boardFilter}
  `);

  const rows = unwrapRows<MetricsRow>(result);
  return rows[0] ?? { completed: 0, updated: 0, created: 0, dueSoon: 0 };
}

export async function fetchRecentActivities(
  db: Database,
  filter: StatisticsFilter,
  limit = 6,
): Promise<ActivityRow[]> {
  const workspaceFilter = filter.workspaceId
    ? sql`AND b."workspaceId" = ${filter.workspaceId}`
    : sql``;

  const boardFilter = filter.boardId
    ? sql`AND b."publicId" = ${filter.boardId}`
    : sql``;

  const result = await db.execute<ActivityRow>(sql`
    SELECT
      ca."workspaceMemberId" AS "workspaceMemberId",
      ca.type AS action,
      c.title AS target,
      ca."createdAt" AS time,
      b.name AS team,
      CASE
        WHEN ca.type = 'card.created' THEN 'Created'
        WHEN ca.type = 'card.archived' THEN 'Completed'
        WHEN ca.type::text LIKE 'card.updated.%' THEN 'Updated'
        ELSE 'Activity'
      END AS status
    FROM card_activity ca
    JOIN card c ON c.id = ca."cardId"
    JOIN list l ON l.id = c."listId"
    JOIN board b ON b.id = l."boardId"
    WHERE ca."createdAt" >= ${filter.from}
      AND ca."createdAt" <= ${filter.to}
      AND b."deletedAt" IS NULL
      AND l."deletedAt" IS NULL
      AND c."deletedAt" IS NULL
      ${workspaceFilter}
      ${boardFilter}
    ORDER BY ca."createdAt" DESC
    LIMIT ${limit}
  `);

  return unwrapRows<ActivityRow>(result);
}

export async function fetchPriorityBreakdown(
  db: Database,
  filter: StatisticsFilter,
  limit?: number,
): Promise<PriorityRow[]> {
  const workspaceFilter = filter.workspaceId
    ? sql`AND b."workspaceId" = ${filter.workspaceId}`
    : sql``;

  const boardFilter = filter.boardId
    ? sql`AND b."publicId" = ${filter.boardId}`
    : sql``;

  const limitClause = limit ? sql`LIMIT ${limit}` : sql``;

  const result = await db.execute<PriorityRow>(sql`
    SELECT
      l.name AS label,
      COUNT(cl."cardId")::int AS count,
      l."colourCode" AS color,
      COALESCE(SUM(COUNT(cl."cardId")) OVER (), 0)::int AS total
    FROM label l
    LEFT JOIN _card_labels cl ON cl."labelId" = l.id
    LEFT JOIN card c ON c.id = cl."cardId"
      AND c."createdAt" >= ${filter.from}
      AND c."createdAt" <= ${filter.to}
      AND c."deletedAt" IS NULL
    JOIN board b ON b.id = l."boardId"
    WHERE b."deletedAt" IS NULL
      AND l."deletedAt" IS NULL
      ${workspaceFilter}
      ${boardFilter}
    GROUP BY l.id, l.name, l."colourCode"
    ORDER BY count DESC
    ${limitClause}
  `);

  return unwrapRows<PriorityRow>(result);
}


export async function fetchWorkloads(
  db: Database,
  filter: StatisticsFilter,
  limit = 6,
): Promise<WorkloadRow[]> {
  const workspaceFilter = filter.workspaceId
    ? sql`AND b."workspaceId" = ${filter.workspaceId}`
    : sql``;

  const boardFilter = filter.boardId
    ? sql`AND b."publicId" = ${filter.boardId}`
    : sql``;

  const result = await db.execute<WorkloadRow>(sql`
    SELECT
      cwm."workspaceMemberId" AS "workspaceMemberId",
      COUNT(*)::int AS "assignedCount"
    FROM _card_workspace_members cwm
    JOIN card c ON c.id = cwm."cardId"
    JOIN list l ON l.id = c."listId"
    JOIN board b ON b.id = l."boardId"
    WHERE c."createdAt" >= ${filter.from}
      AND c."createdAt" <= ${filter.to}
      AND b."deletedAt" IS NULL
      AND l."deletedAt" IS NULL
      AND c."deletedAt" IS NULL
      ${workspaceFilter}
      ${boardFilter}
    GROUP BY cwm."workspaceMemberId"
    ORDER BY "assignedCount" DESC
    LIMIT ${limit}
  `);

  return unwrapRows<WorkloadRow>(result);
}

export async function fetchMemberCompletedTotal(
  db: Database,
  filter: StatisticsFilter & { memberId: string },
): Promise<number> {
  const workspaceFilter = filter.workspaceId
    ? sql`AND b."workspaceId" = ${filter.workspaceId}`
    : sql``;

  const boardFilter = filter.boardId
    ? sql`AND b."publicId" = ${filter.boardId}`
    : sql``;

  const result = await db.execute<{ completed: number }>(sql`
    SELECT
      COALESCE(SUM(CASE WHEN ca.type = 'card.archived' THEN 1 ELSE 0 END), 0)::int AS completed
    FROM card_activity ca
    JOIN card c ON c.id = ca."cardId"
    JOIN list l ON l.id = c."listId"
    JOIN board b ON b.id = l."boardId"
    WHERE ca."createdAt" >= ${filter.from}
      AND ca."createdAt" <= ${filter.to}
      AND ca."workspaceMemberId" = ${filter.memberId}
      AND b."deletedAt" IS NULL
      AND l."deletedAt" IS NULL
      AND c."deletedAt" IS NULL
      ${workspaceFilter}
      ${boardFilter}
  `);

  const rows = unwrapRows<{ completed: number }>(result);
  return rows[0]?.completed ?? 0;
}

export async function fetchTeamCompletedTotal(
  db: Database,
  filter: StatisticsFilter,
): Promise<number> {
  const workspaceFilter = filter.workspaceId
    ? sql`AND b."workspaceId" = ${filter.workspaceId}`
    : sql``;

  const boardFilter = filter.boardId
    ? sql`AND b."publicId" = ${filter.boardId}`
    : sql``;

  const result = await db.execute<{ completed: number }>(sql`
    SELECT
      COALESCE(SUM(CASE WHEN ca.type = 'card.archived' THEN 1 ELSE 0 END), 0)::int AS completed
    FROM card_activity ca
    JOIN card c ON c.id = ca."cardId"
    JOIN list l ON l.id = c."listId"
    JOIN board b ON b.id = l."boardId"
    WHERE ca."createdAt" >= ${filter.from}
      AND ca."createdAt" <= ${filter.to}
      AND b."deletedAt" IS NULL
      AND l."deletedAt" IS NULL
      AND c."deletedAt" IS NULL
      ${workspaceFilter}
      ${boardFilter}
  `);

  const rows = unwrapRows<{ completed: number }>(result);
  return rows[0]?.completed ?? 0;
}

export async function fetchMemberAssignedTotal(
  db: Database,
  filter: StatisticsFilter & { memberId: string },
): Promise<number> {
  const workspaceFilter = filter.workspaceId
    ? sql`AND b."workspaceId" = ${filter.workspaceId}`
    : sql``;

  const boardFilter = filter.boardId
    ? sql`AND b."publicId" = ${filter.boardId}`
    : sql``;

  const result = await db.execute<{ assigned: number }>(sql`
    SELECT
      COUNT(*)::int AS assigned
    FROM _card_workspace_members cwm
    JOIN card c ON c.id = cwm."cardId"
    JOIN list l ON l.id = c."listId"
    JOIN board b ON b.id = l."boardId"
    WHERE c."createdAt" >= ${filter.from}
      AND c."createdAt" <= ${filter.to}
      AND cwm."workspaceMemberId" = ${filter.memberId}
      AND b."deletedAt" IS NULL
      AND l."deletedAt" IS NULL
      AND c."deletedAt" IS NULL
      ${workspaceFilter}
      ${boardFilter}
  `);

  const rows = unwrapRows<{ assigned: number }>(result);
  return rows[0]?.assigned ?? 0;
}

export async function fetchMemberOverdueTotal(
  db: Database,
  filter: StatisticsFilter & { memberId: string },
): Promise<number> {
  const workspaceFilter = filter.workspaceId
    ? sql`AND b."workspaceId" = ${filter.workspaceId}`
    : sql``;

  const boardFilter = filter.boardId
    ? sql`AND b."publicId" = ${filter.boardId}`
    : sql``;

  const result = await db.execute<{ overdue: number }>(sql`
    SELECT
      COUNT(*)::int AS overdue
    FROM _card_workspace_members cwm
    JOIN card c ON c.id = cwm."cardId"
    JOIN list l ON l.id = c."listId"
    JOIN board b ON b.id = l."boardId"
    WHERE c."dueDate" IS NOT NULL
      AND c."dueDate" < ${filter.to}
      AND c."dueDate" >= ${filter.from}
      AND cwm."workspaceMemberId" = ${filter.memberId}
      AND b."deletedAt" IS NULL
      AND l."deletedAt" IS NULL
      AND c."deletedAt" IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM card_activity ca
        WHERE ca."cardId" = c.id
          AND ca.type = 'card.archived'
      )
      ${workspaceFilter}
      ${boardFilter}
  `);

  const rows = unwrapRows<{ overdue: number }>(result);
  return rows[0]?.overdue ?? 0;
}

export async function fetchMemberOverdueTasks(
  db: Database,
  filter: StatisticsFilter & { memberId: string },
  limit = 2,
): Promise<OverdueTaskRow[]> {
  const workspaceFilter = filter.workspaceId
    ? sql`AND b."workspaceId" = ${filter.workspaceId}`
    : sql``;

  const boardFilter = filter.boardId
    ? sql`AND b."publicId" = ${filter.boardId}`
    : sql``;

  const result = await db.execute<OverdueTaskRow>(sql`
    SELECT
      c.id AS id,
      c.title AS title,
      c."dueDate" AS "dueDate"
    FROM _card_workspace_members cwm
    JOIN card c ON c.id = cwm."cardId"
    JOIN list l ON l.id = c."listId"
    JOIN board b ON b.id = l."boardId"
    WHERE c."dueDate" IS NOT NULL
      AND c."dueDate" < ${filter.to}
      AND c."dueDate" >= ${filter.from}
      AND cwm."workspaceMemberId" = ${filter.memberId}
      AND b."deletedAt" IS NULL
      AND l."deletedAt" IS NULL
      AND c."deletedAt" IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM card_activity ca
        WHERE ca."cardId" = c.id
          AND ca.type = 'card.archived'
      )
      ${workspaceFilter}
      ${boardFilter}
    ORDER BY c."dueDate" ASC
    LIMIT ${limit}
  `);

  return unwrapRows<OverdueTaskRow>(result);
}


