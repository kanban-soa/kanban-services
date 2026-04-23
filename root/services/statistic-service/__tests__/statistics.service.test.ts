import { describe, expect, it, vi } from "vitest";
import { getStatistics } from "../services/statistics";
import * as repository from "../repositories/statistics";

type MockDb = { execute: ReturnType<typeof vi.fn> };

function createMockDb(): MockDb {
  return { execute: vi.fn() };
}

describe("getStatistics", () => {
  it("builds a statistics response with normalized priorities and workloads", async () => {
    const db = createMockDb();

    const fetchMetricsSpy = vi.spyOn(repository, "fetchMetrics");
    fetchMetricsSpy
      .mockResolvedValueOnce({
        completed: 10,
        updated: 6,
        created: 4,
        dueSoon: 2,
      })
      .mockResolvedValueOnce({
        completed: 8,
        updated: 5,
        created: 2,
        dueSoon: 1,
      });
    vi.spyOn(repository, "fetchRecentActivities").mockResolvedValue([
      {
        user: "Aki",
        action: "card.created",
        target: "Task 1",
        time: new Date("2025-02-01T10:00:00.000Z"),
        team: "Ops",
        status: "Created",
      },
    ]);
    vi.spyOn(repository, "fetchPriorityBreakdown").mockResolvedValue([
      {
        label: "Urgent",
        count: 2,
        color: "#ef4444",
        total: 4,
      },
    ]);
    vi.spyOn(repository, "fetchWorkloads").mockResolvedValue([
      {
        name: "Ren",
        assignedCount: 7,
      },
    ]);

    const result = await getStatistics(db as unknown as repository.Database, {
      range: "7d",
      workspaceId: "1",
    });

    expect(result.metrics.completed).toBe(10);
    expect(result.metrics.completedTrend).toBe(25);
    expect(result.activities[0]?.time).toBe("Sat Feb 01 2025");
    expect(result.priorities[0]).toEqual({
      label: "Urgent",
      value: 50,
      color: "#ef4444",
    });
    expect(result.workloads[0]).toEqual({
      name: "Ren",
      capacity: 35,
      state: "Available",
    });
  });

  it("defaults to zero priorities when repository returns none", async () => {
    const db = createMockDb();

    const fetchMetricsSpy = vi.spyOn(repository, "fetchMetrics");
    fetchMetricsSpy
      .mockResolvedValueOnce({
        completed: 0,
        updated: 0,
        created: 0,
        dueSoon: 0,
      })
      .mockResolvedValueOnce({
        completed: 0,
        updated: 0,
        created: 0,
        dueSoon: 0,
      });
    vi.spyOn(repository, "fetchRecentActivities").mockResolvedValue([]);
    vi.spyOn(repository, "fetchPriorityBreakdown").mockResolvedValue([]);
    vi.spyOn(repository, "fetchWorkloads").mockResolvedValue([]);

    const result = await getStatistics(db as unknown as repository.Database, {});

    expect(result.priorities).toHaveLength(3);
    expect(result.priorities.map((item) => item.label)).toEqual([
      "Urgent",
      "High Priority",
      "Normal",
    ]);
  });

  it("handles activity times that are strings", async () => {
    const db = createMockDb();

    const fetchMetricsSpy = vi.spyOn(repository, "fetchMetrics");
    fetchMetricsSpy
      .mockResolvedValueOnce({
        completed: 1,
        updated: 1,
        created: 1,
        dueSoon: 1,
      })
      .mockResolvedValueOnce({
        completed: 0,
        updated: 0,
        created: 0,
        dueSoon: 0,
      });
    vi.spyOn(repository, "fetchRecentActivities").mockResolvedValue([
      {
        user: "Mira",
        action: "card.updated.title",
        target: "Task 2",
        time: "2025-02-02T08:00:00.000Z" as unknown as Date,
        team: null,
        status: "Updated",
      },
    ]);
    vi.spyOn(repository, "fetchPriorityBreakdown").mockResolvedValue([]);
    vi.spyOn(repository, "fetchWorkloads").mockResolvedValue([]);

    const result = await getStatistics(db as unknown as repository.Database, {
      range: "30d",
    });

    expect(result.activities[0]?.time).toBe("Sun Feb 02 2025");
    expect(result.activities[0]?.team).toBe("Team");
  });
});
