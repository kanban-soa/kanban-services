import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const insertReturning = vi.fn();
  const insertValues = vi.fn(() => ({ returning: insertReturning }));
  const insertFn = vi.fn(() => ({ values: insertValues }));

  const selectChain: any = {};
  selectChain.from = vi.fn(() => selectChain);
  selectChain.where = vi.fn(() => selectChain);
  selectChain.orderBy = vi.fn(() => selectChain);
  selectChain.limit = vi.fn(() => selectChain);
  selectChain.offset = vi.fn();
  const selectFn = vi.fn(() => selectChain);

  const updateReturning = vi.fn();
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const updateFn = vi.fn(() => ({ set: updateSet }));

  return {
    insertReturning,
    insertValues,
    insertFn,
    selectChain,
    selectFn,
    updateReturning,
    updateWhere,
    updateSet,
    updateFn,
  };
});

vi.mock("@/noti-service/config", () => ({
  db: {
    insert: mocks.insertFn,
    select: mocks.selectFn,
    update: mocks.updateFn,
  },
  pool: {},
}));

vi.mock("nanoid", () => ({
  customAlphabet: () => () => "pub_test_id_1",
}));

import { NotificationsService } from "../services/notification.service";
import { notifications } from "../schema";

const service = new NotificationsService();

const baseInput = {
  type: "card.member.added",
  userId: "00000000-0000-0000-0000-000000000001",
  cardId: "00000000-0000-0000-0000-000000000002",
  commentId: "00000000-0000-0000-0000-000000000003",
  workspaceId: "00000000-0000-0000-0000-000000000004",
};

beforeEach(() => {
  mocks.insertReturning.mockReset();
  mocks.insertValues.mockClear();
  mocks.insertFn.mockClear();
  mocks.selectChain.from.mockClear();
  mocks.selectChain.where.mockClear();
  mocks.selectChain.orderBy.mockClear();
  mocks.selectChain.limit.mockClear();
  mocks.selectChain.offset.mockReset();
  mocks.selectChain.offset.mockReturnValue(Promise.resolve([]));
  mocks.selectFn.mockClear();
  mocks.updateReturning.mockReset();
  mocks.updateWhere.mockClear();
  mocks.updateSet.mockClear();
  mocks.updateFn.mockClear();
});

describe("NotificationsService.createNotification", () => {
  it("inserts a notification with a generated publicId and returns the row", async () => {
    const fakeRow = { id: "row-1", publicId: "pub_test_id_1", ...baseInput, read: false };
    mocks.insertReturning.mockResolvedValueOnce([fakeRow]);

    const result = await service.createNotification({ ...baseInput, metadata: { foo: 1 } });

    expect(mocks.insertFn).toHaveBeenCalledWith(notifications);
    const valuesArg = mocks.insertValues.mock.calls[0]![0];
    expect(valuesArg).toMatchObject({
      publicId: "pub_test_id_1",
      type: baseInput.type,
      userId: baseInput.userId,
      cardId: baseInput.cardId,
      read: false,
    });
    expect(valuesArg.metadata).toBe(JSON.stringify({ foo: 1 }));
    expect(result).toEqual(fakeRow);
  });

  it("keeps metadata null when not supplied", async () => {
    mocks.insertReturning.mockResolvedValueOnce([{ id: "row-2" }]);
    await service.createNotification(baseInput);
    expect(mocks.insertValues.mock.calls[0]![0].metadata).toBeNull();
  });

  it("passes a string metadata through verbatim", async () => {
    mocks.insertReturning.mockResolvedValueOnce([{ id: "row-3" }]);
    await service.createNotification({ ...baseInput, metadata: "raw-string" });
    expect(mocks.insertValues.mock.calls[0]![0].metadata).toBe("raw-string");
  });
});

describe("NotificationsService.listForUser", () => {
  it("applies default limit and offset", async () => {
    mocks.selectChain.offset.mockResolvedValueOnce([{ id: "n1" }]);
    const result = await service.listForUser(baseInput.userId);
    expect(mocks.selectChain.limit).toHaveBeenCalledWith(20);
    expect(mocks.selectChain.offset).toHaveBeenCalledWith(0);
    expect(result).toEqual([{ id: "n1" }]);
  });

  it("clamps limit to the [1, 100] range and offset to >= 0", async () => {
    mocks.selectChain.offset.mockResolvedValueOnce([]);
    await service.listForUser(baseInput.userId, { limit: 500, offset: -3 });
    expect(mocks.selectChain.limit).toHaveBeenCalledWith(100);
    expect(mocks.selectChain.offset).toHaveBeenCalledWith(0);
  });

  it("passes the where clause once whether or not unreadOnly is set", async () => {
    mocks.selectChain.offset.mockResolvedValueOnce([]);
    await service.listForUser(baseInput.userId, { unreadOnly: true });
    expect(mocks.selectChain.where).toHaveBeenCalledTimes(1);
  });
});

describe("NotificationsService.getUnreadCount", () => {
  it("returns the count from the aggregate query", async () => {
    mocks.selectChain.where.mockReturnValueOnce(Promise.resolve([{ count: 7 }]) as any);
    const result = await service.getUnreadCount(baseInput.userId);
    expect(result).toBe(7);
  });

  it("returns 0 when no row comes back", async () => {
    mocks.selectChain.where.mockReturnValueOnce(Promise.resolve([]) as any);
    const result = await service.getUnreadCount(baseInput.userId);
    expect(result).toBe(0);
  });
});

describe("NotificationsService.markAsRead", () => {
  it("returns the updated row when one matches", async () => {
    const row = { id: "row-x", read: true };
    mocks.updateReturning.mockResolvedValueOnce([row]);
    const result = await service.markAsRead("pub_test_id_1", baseInput.userId);
    expect(mocks.updateSet).toHaveBeenCalledWith({ read: true });
    expect(result).toEqual(row);
  });

  it("returns null when nothing was updated", async () => {
    mocks.updateReturning.mockResolvedValueOnce([]);
    const result = await service.markAsRead("missing", baseInput.userId);
    expect(result).toBeNull();
  });
});

describe("NotificationsService.markAllAsRead", () => {
  it("issues an update without returning rows", async () => {
    mocks.updateWhere.mockResolvedValueOnce(undefined as any);
    await service.markAllAsRead(baseInput.userId);
    expect(mocks.updateSet).toHaveBeenCalledWith({ read: true });
    expect(mocks.updateWhere).toHaveBeenCalledTimes(1);
  });
});

describe("NotificationsService.deleteNotification", () => {
  it("soft-deletes and returns the row", async () => {
    mocks.updateReturning.mockResolvedValueOnce([{ id: "del-1" }]);
    const result = await service.deleteNotification("pub_test_id_1", baseInput.userId);
    const setArg = mocks.updateSet.mock.calls[0]![0] as { deletedAt: Date };
    expect(setArg.deletedAt).toBeInstanceOf(Date);
    expect(result).toEqual({ id: "del-1" });
  });

  it("returns null when no match", async () => {
    mocks.updateReturning.mockResolvedValueOnce([]);
    const result = await service.deleteNotification("missing", baseInput.userId);
    expect(result).toBeNull();
  });
});
