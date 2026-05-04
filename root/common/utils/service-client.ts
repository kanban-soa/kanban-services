export type ServiceClientOptions = {
  baseUrl: string;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
};

export type ServiceRequestContext = {
  requestId?: string;
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
};

export type ServiceRequestOptions = {
  method: string;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  body?: unknown;
  context?: ServiceRequestContext;
  timeoutMs?: number;
};

export type ServiceResponse<T> = {
  status: number;
  data: T;
  headers: Record<string, string>;
};

export class ServiceClientError extends Error {
  status: number;
  responseBody?: unknown;

  constructor(message: string, status: number, responseBody?: unknown) {
    super(message);
    this.name = "ServiceClientError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function buildQuery(query?: ServiceRequestOptions["query"]): string {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }
    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

function buildHeaders(
  options: ServiceClientOptions,
  request: ServiceRequestOptions
): Headers {
  const headers = new Headers();

  if (options.defaultHeaders) {
    for (const [key, value] of Object.entries(options.defaultHeaders)) {
      headers.set(key, value);
    }
  }

  if (request.headers) {
    for (const [key, value] of Object.entries(request.headers)) {
      headers.set(key, value);
    }
  }

  if (request.context?.requestId) {
    headers.set("x-request-id", request.context.requestId);
  }

  if (request.context?.user?.id) {
    headers.set("x-user-id", request.context.user.id);
  }
  if (request.context?.user?.email) {
    headers.set("x-user-email", request.context.user.email);
  }
  if (request.context?.user?.role) {
    headers.set("x-user-role", request.context.user.role);
  }

  return headers;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }
  return Object.getPrototypeOf(value) === Object.prototype;
}

function extractHeaders(headers: Headers): Record<string, string> {
  const output: Record<string, string> = {};
  headers.forEach((value, key) => {
    output[key] = value;
  });
  return output;
}

export function createServiceClient(options: ServiceClientOptions) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  async function requestJson<T>(request: ServiceRequestOptions): Promise<ServiceResponse<T>> {
    const query = buildQuery(request.query);
    const url = `${baseUrl}${request.path}${query}`;
    const headers = buildHeaders(options, request);
    const timeoutMs = request.timeoutMs ?? options.timeoutMs ?? 8000;

    let body: string | undefined;
    if (request.body !== undefined) {
      if (isPlainObject(request.body) || Array.isArray(request.body)) {
        body = JSON.stringify(request.body);
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json");
        }
      } else if (typeof request.body === "string") {
        body = request.body;
      } else {
        body = JSON.stringify(request.body);
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json");
        }
      }
    }

    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const responseHeaders = extractHeaders(response.headers);
    const contentType = response.headers.get("content-type") ?? "";
    let payload: unknown;

    if (contentType.includes("application/json")) {
      payload = await response.json().catch(() => null);
    } else {
      payload = await response.text().catch(() => "");
    }

    if (!response.ok) {
      throw new ServiceClientError(
        `Request failed with status ${response.status}`,
        response.status,
        payload
      );
    }

    return {
      status: response.status,
      data: payload as T,
      headers: responseHeaders,
    };
  }

  return {
    requestJson,
  };
}

