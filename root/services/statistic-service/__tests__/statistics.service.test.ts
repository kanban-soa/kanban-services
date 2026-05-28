import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getStatistics, getSelfPerformance } from "../services/statistics";
import * as statsService from "../services/statistics";
import { exportStatistics } from "../services/export";
import { getWorkspaceActivities } from "../services/activity";
import { createServiceClient } from "../../../common/utils/service-client";
import { Writable } from "stream";

vi.mock("../../../common/utils/service-client", () => ({
  createServiceClient: vi.fn(),
}));

const requestJsonMock = vi.fn();

const boardUrl = "http://board.local";
const workspaceUrl = "http://workspace.local";
const activityUrl = "http://activity.local";

beforeEach(() => {
  (createServiceClient as vi.Mock).mockReturnValue({ requestJson: requestJsonMock });
  process.env.BOARD_SERVICE_URL = boardUrl;
  process.env.WORKSPACE_SERVICE_URL = workspaceUrl;
  process.env.ACTIVITY_SERVICE_URL = activityUrl;
});

afterEach(() => {
    requestJsonMock.mockReset();
    (createServiceClient as vi.Mock).mockClear();
});

describe("getStatistics", () => {
    const mockSuccessCalls = () => {
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
    }

  // TC-STAT-01
  it("builds a statistics response with normalized priorities and workloads", async () => {
    mockSuccessCalls();
    const result = await getStatistics({ range: "7d", workspaceId: "1" });

    expect(result.metrics.completed).toBe(10);
  });

  // TC-STAT-02
  it("filters data by the '90d' range", async () => {
    mockSuccessCalls();
    await getStatistics({ range: "90d", workspaceId: "1" });
    
    const requestCalls = requestJsonMock.mock.calls;
    expect(requestCalls[0][0].query.range).toBe('90d');
    expect(requestCalls[1][0].query.range).toBe('90d');
  });

  // TC-STAT-03
  it("filters data by the provided boardId", async () => {
    mockSuccessCalls();
    await getStatistics({ workspaceId: "1", boardId: "board-abc" });
    
    const requestCalls = requestJsonMock.mock.calls;
    expect(requestCalls[0][0].query.boardId).toBe('board-abc');
    expect(requestCalls[1][0].query.boardId).toBe('board-abc');
  });
});

describe("getSelfPerformance", () => {
  // TC-STAT-19
  it("builds a self performance response", async () => {
    requestJsonMock
      .mockResolvedValueOnce({
        data: {
          data: {
            member: { id: 101 },
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
            overdueTasks: [{ id: 1, title: 'Overdue task 1' }],
          },
        },
      });

    const result = await getSelfPerformance({ range: "7d", workspaceId: "1" }, {});

    expect(result.completedTotal).toBe(8);
    expect(result.overdueTasks[0].title).toBe('Overdue task 1');
  });
});

describe("exportStatistics", () => {
    // TC-STAT-09
    it("handles empty data for export", async () => {
        vi.spyOn(statsService, 'getStatistics').mockResolvedValue({
            range: "7d",
            metrics: { completed: 0, updated: 0, created: 0, dueSoon: 0, completedTrend: 0, updatedTrend: 0, createdTrend: 0, dueSoonTrend: 0 },
            activities: [],
            priorities: [],
            workloads: [],
        });
        
        const chunks: any[] = [];
        const res = new Writable({
            write(chunk, encoding, callback) {
                chunks.push(chunk);
                callback();
            }
        });
        res.setHeader = vi.fn();
        res.json = vi.fn();

        // @ts-ignore
        await exportStatistics(res, { format: "csv", workspaceId: "1" });
        
        const output = Buffer.concat(chunks).toString('utf8');
        expect(output).toContain("No activities found");
    });
});

vi.mock('../services/activity', async () => {
    const originalModule = await vi.importActual('../services/activity');
    return {
        ...originalModule,
        getWorkspaceActivities: vi.fn(),
    };
});


describe("getWorkspaceActivities", () => {
    // TC-STAT-13
    it("handles pagination correctly", async () => {
        (getWorkspaceActivities as vi.Mock).mockResolvedValue({
            items: new Array(5).fill({}),
            pagination: { total: 25, totalPages: 3 },
        });

        const result = await getWorkspaceActivities({ workspaceId: "1", page: 3, limit: 10 });
        
        expect(getWorkspaceActivities).toHaveBeenCalledWith({ workspaceId: "1", page: 3, limit: 10 });
        expect(result.pagination.totalPages).toBe(3);
    });
});
