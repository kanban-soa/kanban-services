import { sql } from "drizzle-orm";
import type { Database } from "../config/database";

export type StatisticsFilter = {
  workspaceId?: number;
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
  user: string;
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
  name: string;
  assignedCount: number;
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
      ${workspaceFilter}
  `);

  const rows = unwrapRows<MetricsRow>(result);
  const row = rows[0];

  return row ?? { completed: 0, updated: 0, created: 0, dueSoon: 0 };
}

export async function fetchRecentActivities(
  db: Database,
  filter: StatisticsFilter,
  limit = 6,
): Promise<ActivityRow[]> {
  const workspaceFilter = filter.workspaceId
    ? sql`AND b."workspaceId" = ${filter.workspaceId}`
    : sql``;

  const result = await db.execute<ActivityRow>(sql`
    SELECT
      COALESCE(u.name, wm.email, 'Unknown') AS "user",
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
    LEFT JOIN "user" u ON u.id = ca."createdBy"
    LEFT JOIN workspace_members wm ON wm.id = ca."workspaceMemberId"
    WHERE ca."createdAt" >= ${filter.from}
      AND ca."createdAt" <= ${filter.to}
      ${workspaceFilter}
    ORDER BY ca."createdAt" DESC
    LIMIT ${limit}
  `);

  return unwrapRows<ActivityRow>(result);
}

export async function fetchPriorityBreakdown(
  db: Database,
  filter: StatisticsFilter,
): Promise<PriorityRow[]> {
  const workspaceFilter = filter.workspaceId
    ? sql`AND b."workspaceId" = ${filter.workspaceId}`
    : sql``;

  const result = await db.execute<PriorityRow>(sql`
    SELECT
      l.name AS label,
      COUNT(*)::int AS count,
      l."colourCode" AS color,
      SUM(COUNT(*)) OVER ()::int AS total
    FROM _card_labels cl
    JOIN label l ON l.id = cl."labelId"
    JOIN card c ON c.id = cl."cardId"
    JOIN list li ON li.id = c."listId"
    JOIN board b ON b.id = li."boardId"
    WHERE c."createdAt" >= ${filter.from}
      AND c."createdAt" <= ${filter.to}
      ${workspaceFilter}
    GROUP BY l.id, l.name, l."colourCode"
    ORDER BY count DESC
    LIMIT 3
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

  const result = await db.execute<WorkloadRow>(sql`
    SELECT
      COALESCE(u.name, wm.email, 'Unknown') AS name,
      COUNT(*)::int AS "assignedCount"
    FROM _card_workspace_members cwm
    JOIN workspace_members wm ON wm.id = cwm."workspaceMemberId"
    LEFT JOIN "user" u ON u.id = wm."userId"
    JOIN card c ON c.id = cwm."cardId"
    JOIN list l ON l.id = c."listId"
    JOIN board b ON b.id = l."boardId"
    WHERE c."createdAt" >= ${filter.from}
      AND c."createdAt" <= ${filter.to}
      ${workspaceFilter}
    GROUP BY u.name, wm.email
    ORDER BY "assignedCount" DESC
    LIMIT ${limit}
  `);

  return unwrapRows<WorkloadRow>(result);
}
