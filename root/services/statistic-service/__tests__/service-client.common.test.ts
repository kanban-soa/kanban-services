import { describe, expect, it, vi } from "vitest";
import { createServiceClient, ServiceClientError } from "../../common/utils/service-client";

describe("common service client", () => {
  it("builds query params and forwards headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({ ok: true }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = createServiceClient({
      baseUrl: "http://internal.local",
      defaultHeaders: { "x-client": "stat" },
    });

    const res = await client.requestJson<{ ok: boolean }>({
      method: "GET",
      path: "/metrics",
      query: { range: "7d", workspaceId: "abc" },
      context: { requestId: "req-1", user: { id: "u1" } },
    });

    console.log('response: ' + JSON.stringify(res));

    const call = fetchMock.mock.calls[0][0] as string;
    const init = fetchMock.mock.calls[0][1] as RequestInit;

    expect(call).toBe("http://internal.local/metrics?range=7d&workspaceId=abc");
    expect((init.headers as Headers).get("x-request-id")).toBe("req-1");
    expect((init.headers as Headers).get("x-user-id")).toBe("u1");
    expect((init.headers as Headers).get("x-client")).toBe("stat");
  });

  it("throws ServiceClientError for non-2xx responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({ error: "bad" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = createServiceClient({ baseUrl: "http://internal.local" });

    await expect(
      client.requestJson({ method: "GET", path: "/bad" })
    ).rejects.toBeInstanceOf(ServiceClientError);
  });
});

