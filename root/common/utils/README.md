# Common Utils

## Service Client

A small HTTP client helper for internal service-to-service calls. It wraps `fetch`, builds query strings, forwards request context headers, and returns typed JSON responses. Non-2xx responses throw a `ServiceClientError` with the status and response body.

### Features

- Base URL normalization
- Query string builder for simple key/value params
- Optional timeout per request
- Context header propagation (`x-request-id`, `x-user-*`)
- Typed error for non-2xx responses

### Usage Example

```ts
import { createServiceClient } from "@/common/utils/service-client";

type WorkspaceListResponse = {
  data: Array<{ id: string; name: string }>;
};

const workspaceClient = createServiceClient({
  baseUrl: process.env.WORKSPACE_SERVICE_URL!,
  timeoutMs: 8000,
  defaultHeaders: {
    "x-client": "stat-service",
  },
});

export async function fetchWorkspaces(requestId?: string, userId?: string) {
  const response = await workspaceClient.requestJson<WorkspaceListResponse>({
    method: "GET",
    path: "/api/workspaces",
    query: { limit: 20 },
    context: {
      requestId,
      user: { id: userId },
    },
  });

  return response.data;
}
```

### Error Handling

```ts
import { ServiceClientError } from "@/common/utils/service-client";

try {
  await workspaceClient.requestJson({ method: "GET", path: "/api/workspaces" });
} catch (error) {
  if (error instanceof ServiceClientError) {
    console.error("Upstream failed", error.status, error.responseBody);
  } else {
    throw error;
  }
}
```

