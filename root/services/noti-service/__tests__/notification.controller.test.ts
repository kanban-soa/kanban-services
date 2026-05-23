import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { NotificationsService } from "../services/notification.service";

function makeRes() {
  const res: Partial<Response> & {
    statusCode: number;
    body: unknown;
    ended: boolean;
  } = {
    statusCode: 200,
    body: undefined,
    ended: false,
  };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res as Response;
  }) as any;
  res.json = vi.fn((payload: unknown) => {
    res.body = payload;
    return res as Response;
  }) as any;
  res.end = vi.fn(() => {
    res.ended = true;
    return res as Response;
  }) as any;
  return res as Response & {
    statusCode: number;
    body: any;
    ended: boolean;
  };
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  } as Request;
}

const userId = "00000000-0000-0000-0000-000000000001";
const authedHeaders = { "x-user-id": userId };

let service: NotificationsService;
let controller: NotificationController;

beforeEach(() => {
  service = {
    createNotification: vi.fn(),
    listForUser: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
  } as unknown as NotificationsService;

  controller = new NotificationController(service);
});

describe("NotificationController.create", () => {
  it("rejects when required fields are missing", async () => {
    const res = makeRes();
    await controller.create(makeReq({ body: { type: "x", userId } }), res);
    expect(res.statusCode).toBe(400);
    expect(service.createNotification).not.toHaveBeenCalled();
  });

  it("creates a notification when payload is valid", async () => {
    const fakeRow = { publicId: "p1" };
    (service.createNotification as any).mockResolvedValueOnce(fakeRow);

    const res = makeRes();
    const body = {
      type: "card.member.added",
      userId,
      cardId: "c1",
      commentId: "c1",
      workspaceId: "w1",
      metadata: { foo: 1 },
    };
    await controller.create(makeReq({ body }), res);

    expect(service.createNotification).toHaveBeenCalledWith(body);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(fakeRow);
  });

  it("returns 500 when the service throws", async () => {
    (service.createNotification as any).mockRejectedValueOnce(new Error("boom"));
    const res = makeRes();
    await controller.create(
      makeReq({
        body: {
          type: "x",
          userId,
          cardId: "c",
          commentId: "c",
          workspaceId: "w",
        },
      }),
      res,
    );
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "boom" });
  });
});

describe("NotificationController.list", () => {
  it("requires the x-user-id header", async () => {
    const res = makeRes();
    await controller.list(makeReq(), res);
    expect(res.statusCode).toBe(401);
    expect(service.listForUser).not.toHaveBeenCalled();
  });

  it("forwards limit/offset and unread flag", async () => {
    (service.listForUser as any).mockResolvedValueOnce([{ publicId: "n1" }]);
    const res = makeRes();
    await controller.list(
      makeReq({
        headers: authedHeaders as any,
        query: { limit: "5", offset: "10", unread: "true" },
      }),
      res,
    );
    expect(service.listForUser).toHaveBeenCalledWith(userId, {
      limit: 5,
      offset: 10,
      unreadOnly: true,
    });
    expect(res.body).toEqual({ items: [{ publicId: "n1" }] });
  });
});

describe("NotificationController.unreadCount", () => {
  it("returns the count from the service", async () => {
    (service.getUnreadCount as any).mockResolvedValueOnce(3);
    const res = makeRes();
    await controller.unreadCount(makeReq({ headers: authedHeaders as any }), res);
    expect(res.body).toEqual({ count: 3 });
  });

  it("rejects without the user header", async () => {
    const res = makeRes();
    await controller.unreadCount(makeReq(), res);
    expect(res.statusCode).toBe(401);
  });
});

describe("NotificationController.markRead", () => {
  it("returns the updated row", async () => {
    const row = { publicId: "p1", read: true };
    (service.markAsRead as any).mockResolvedValueOnce(row);
    const res = makeRes();
    await controller.markRead(
      makeReq({ headers: authedHeaders as any, params: { publicId: "p1" } as any }),
      res,
    );
    expect(service.markAsRead).toHaveBeenCalledWith("p1", userId);
    expect(res.body).toEqual(row);
  });

  it("404s when not found", async () => {
    (service.markAsRead as any).mockResolvedValueOnce(null);
    const res = makeRes();
    await controller.markRead(
      makeReq({ headers: authedHeaders as any, params: { publicId: "missing" } as any }),
      res,
    );
    expect(res.statusCode).toBe(404);
  });
});

describe("NotificationController.markAllRead", () => {
  it("calls service and 204s", async () => {
    (service.markAllAsRead as any).mockResolvedValueOnce(undefined);
    const res = makeRes();
    await controller.markAllRead(makeReq({ headers: authedHeaders as any }), res);
    expect(service.markAllAsRead).toHaveBeenCalledWith(userId);
    expect(res.statusCode).toBe(204);
    expect(res.ended).toBe(true);
  });
});

describe("NotificationController.remove", () => {
  it("204s on success", async () => {
    (service.deleteNotification as any).mockResolvedValueOnce({ publicId: "p1" });
    const res = makeRes();
    await controller.remove(
      makeReq({ headers: authedHeaders as any, params: { publicId: "p1" } as any }),
      res,
    );
    expect(res.statusCode).toBe(204);
  });

  it("404s when nothing was deleted", async () => {
    (service.deleteNotification as any).mockResolvedValueOnce(null);
    const res = makeRes();
    await controller.remove(
      makeReq({ headers: authedHeaders as any, params: { publicId: "x" } as any }),
      res,
    );
    expect(res.statusCode).toBe(404);
  });
});
