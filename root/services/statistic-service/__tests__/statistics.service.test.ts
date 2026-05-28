import { describe, expect, it, vi, beforeEach } from "vitest";
import { getStatistics, getSelfPerformance } from "../services/statistics";
import { createServiceClient } from "../../../common/utils/service-client";

const requestJsonMock = vi.fn();

vi.mock("../../../common/utils/service-client", () => ({
  createServiceClient: vi.fn(() => ({ requestJson: requestJsonMock })),
}));

const boardUrl = "http://board.local";
const workspaceUrl = "http://workspace.local";

beforeEach(() => {
  requestJsonMock.mockReset();
  (createServiceClient as unknown as vi.Mock).mockClear();
  process.env.BOARD_SERVICE_URL = boardUrl;
  process.env.WORKSPACE_SERVICE_URL = workspaceUrl;
});

describe("getStatistics", () => {
  // TC-STAT-01, TC-STAT-02, TC-STAT-03, TC-STAT-08
  it("builds a statistics response with normalized priorities and workloads", async () => {
    requestJsonMock
      .mockResolvedValueOnce({
        data: {
          data: { completed: 10, updated: 6, created: 4, dueSoon: 2 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: { completed: 8, updated: 5, created: 2, dueSoon: 1 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              workspaceMemberId: 101,
              action: "card.created",
              target: "Task 1",
              time: new Date("2025-02-01T10:00:00.000Z"),
              team: "Ops",
              status: "Created",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              label: "Urgent",
              count: 2,
              color: "#ef4444",
              total: 4,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              workspaceMemberId: 101,
              assignedCount: 7,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            members: [{ id: 101, email: "ren@example.com", userId: "u1" }],
          },
        },
      });

    const result = await getStatistics({ range: "7d", workspaceId: "1" });

    expect(result.metrics.completed).toBe(10);
    expect(result.metrics.completedTrend).toBe(25);
    expect(result.activities[0]?.time).toBe("Sat Feb 01 2025");
    expect(result.activities[0]?.user).toBe("ren@example.com");
    expect(result.priorities[0]).toEqual({
      label: "Urgent",
      value: 50,
      color: "#ef4444",
    });
    expect(result.workloads[0]).toEqual({
      name: "ren@example.com",
      capacity: 35,
      state: "Available",
    });
  });

  it("defaults to zero priorities when board service returns none", async () => {
    requestJsonMock
      .mockResolvedValueOnce({
        data: {
          data: { completed: 0, updated: 0, created: 0, dueSoon: 0 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: { completed: 0, updated: 0, created: 0, dueSoon: 0 },
        },
      })
      .mockResolvedValueOnce({
        data: { data: [] },
      })
      .mockResolvedValueOnce({
        data: { data: [] },
      })
      .mockResolvedValueOnce({
        data: { data: [] },
      })
      .mockResolvedValueOnce({
        data: { data: { members: [] } },
      });

    const result = await getStatistics({});

    expect(result.priorities).toHaveLength(3);
    expect(result.priorities.map((item) => item.label)).toEqual([
      "Urgent",
      "High Priority",
      "Normal",
    ]);
  });

  // TC-STAT-08
  it("handles activity times that are strings", async () => {
    requestJsonMock
      .mockResolvedValueOnce({
        data: {
          data: { completed: 1, updated: 1, created: 1, dueSoon: 1 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: { completed: 0, updated: 0, created: 0, dueSoon: 0 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              workspaceMemberId: 404,
              action: "card.updated.title",
              target: "Task 2",
              time: "2025-02-02T08:00:00.000Z",
              team: null,
              status: "Updated",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { data: [] },
      })
      .mockResolvedValueOnce({
        data: { data: [] },
      })
      .mockResolvedValueOnce({
        data: { data: { members: [{ id: 404, email: "mira@example.com" }] } },
      });

    const result = await getStatistics({ range: "30d", workspaceId: "1" });

    expect(result.activities[0]?.time).toBe("Sun Feb 02 2025");
    expect(result.activities[0]?.team).toBe("Team");
    expect(result.activities[0]?.user).toBe("mira@example.com");
  });
});

describe("getSelfPerformance", () => {
  // TC-STAT-11, TC-STAT-12
  it("builds a self performance response with comparison and completion percentages", async () => {
    requestJsonMock
      .mockResolvedValueOnce({
        data: {
          data: {
            member: {
              id: 101,
              publicId: "mem-101",
              userId: "u1",
              email: "ren@example.com",
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            completedTotal: 8,
            overdueTotal: 2,
            assignedTotal: 16,
            teamCompletedTotal: 32,
            overdueTasks: [{ id: 1, title: 'Overdue task 1', dueDate: '2023-01-01' }],
          },
        },
      });

    const result = await getSelfPerformance({ range: "7d", workspaceId: "1" }, { authorization: "Bearer token" });

    expect(result.completedTotal).toBe(8);
    expect(result.overdueTotal).toBe(2);
    expect(result.completedPercentage).toBe(50);
    expect(result.comparisonPercentage).toBe(25);
    expect(result.overdueTasks).toHaveLength(1);
    expect(result.overdueTasks[0].title).toBe('Overdue task 1');
  });
});
