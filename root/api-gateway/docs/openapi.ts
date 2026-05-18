export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "API Gateway",
    version: "1.0.0",
    description: "API documentation for the Kanban API Gateway.",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "gateway", description: "Gateway endpoints" },
    { name: "auth", description: "Auth service proxy" },
    { name: "workspaces", description: "Workspace service proxy" },
    { name: "boards", description: "Board service proxy" },
    { name: "notifications", description: "Notification service proxy" },
    { name: "statistics", description: "Statistic service proxy" },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        description: "Returns gateway health and timestamp.",
        tags: ["gateway"],
        responses: {
          "200": {
            description: "Gateway is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        summary: "Login",
        description: "Proxies to the auth service login endpoint.",
        tags: ["auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Login successful" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        summary: "Register",
        description: "Proxies to the auth service register endpoint.",
        tags: ["auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": { description: "User registered" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/api/v1/auth/verify-jwt": {
      post: {
        summary: "Verify JWT",
        description: "Proxies to the auth service JWT verification endpoint.",
        tags: ["auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyJwtRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Token is valid" },
          "401": { description: "Token is invalid or expired" },
        },
      },
    },
    "/api/v1/workspaces": {
      get: {
        summary: "List workspaces",
        description: "Proxies to the workspace service.",
        tags: ["workspaces"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestIdHeader" }],
        responses: {
          "200": { description: "Workspace list" },
          "401": { description: "Missing or invalid token" },
        },
      },
      post: {
        summary: "Create workspace",
        description: "Proxies to the workspace service.",
        tags: ["workspaces"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestIdHeader" }],
        responses: {
          "201": { description: "Workspace created" },
          "400": { description: "Validation error" },
          "401": { description: "Missing or invalid token" },
        },
      },
    },
    "/api/v1/boards": {
      get: {
        summary: "List boards",
        description: "Proxies to the board service.",
        tags: ["boards"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestIdHeader" }],
        responses: {
          "200": { description: "Board list" },
          "401": { description: "Missing or invalid token" },
        },
      },
      post: {
        summary: "Create board",
        description: "Proxies to the board service.",
        tags: ["boards"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestIdHeader" }],
        responses: {
          "201": { description: "Board created" },
          "400": { description: "Validation error" },
          "401": { description: "Missing or invalid token" },
        },
      },
    },
    "/api/v1/notifications": {
      get: {
        summary: "List notifications",
        description: "Proxies to the notification service.",
        tags: ["notifications"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/RequestIdHeader" }],
        responses: {
          "200": { description: "Notification list" },
          "401": { description: "Missing or invalid token" },
        },
      },
    },
    "/api/v1/statistics/{workspaceId}": {
      get: {
        summary: "Get statistics",
        description: "Proxies to the statistic service.",
        tags: ["statistics"],
        parameters: [
          { $ref: "#/components/parameters/RequestIdHeader" },
          {
            name: "workspaceId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Workspace identifier.",
          },
          {
            name: "range",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["7d", "30d", "90d"], default: "7d" },
            description: "Time window for statistics.",
          },
        ],
        responses: {
          "200": { description: "Statistics payload" },
          "400": { description: "Invalid query parameters" },
        },
      },
    },
    "/api/v1/statistics/{workspaceId}/export": {
      get: {
        summary: "Export statistics",
        description: "Proxies to the statistic service.",
        tags: ["statistics"],
        parameters: [
          { $ref: "#/components/parameters/RequestIdHeader" },
          {
            name: "workspaceId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Workspace identifier.",
          },
          {
            name: "range",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["7d", "30d", "90d"], default: "7d" },
            description: "Time window for statistics.",
          },
          {
            name: "format",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["csv", "json"], default: "csv" },
            description: "Export format.",
          },
        ],
        responses: {
          "200": { description: "Exported statistics file" },
          "400": { description: "Invalid query parameters" },
        },
      },
    },
    "/api/v1/statistics/{workspaceId}/activities": {
      get: {
        summary: "List workspace activity",
        description: "Proxies to the statistic service activity endpoint (admin/owner only).",
        tags: ["statistics"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/RequestIdHeader" },
          {
            name: "workspaceId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Workspace identifier.",
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, default: 1 },
            description: "Page number.",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            description: "Page size.",
          },
          {
            name: "actionType",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Filter by action type (e.g., card.updated).",
          },
          {
            name: "entityType",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Filter by entity type (board, card).",
          },
          {
            name: "actorUserId",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Filter by actor user id.",
          },
          {
            name: "from",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
            description: "Filter by start timestamp (inclusive).",
          },
          {
            name: "to",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
            description: "Filter by end timestamp (inclusive).",
          },
        ],
        responses: {
          "200": {
            description: "Activity list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ActivityListResponse" },
              },
            },
          },
          "401": { description: "Missing or invalid token" },
          "403": { description: "Forbidden" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    parameters: {
      RequestIdHeader: {
        name: "x-request-id",
        in: "header",
        required: false,
        schema: { type: "string" },
        description: "Optional request correlation id.",
      },
    },
    schemas: {
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string" },
          service: { type: "string" },
          timestamp: { type: "string" },
        },
        required: ["status", "service", "timestamp"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
        required: ["email", "password"],
      },
      RegisterRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
          name: { type: "string" },
        },
        required: ["email", "password", "name"],
      },
      VerifyJwtRequest: {
        type: "object",
        properties: {
          token: { type: "string" },
        },
        required: ["token"],
      },
      ActivityEvent: {
        type: "object",
        properties: {
          id: { type: "string" },
          workspaceId: { type: "number" },
          actorUserId: { type: "string" },
          actionType: { type: "string" },
          entityType: { type: "string" },
          entityId: { type: "string" },
          metadata: { type: "object", nullable: true, additionalProperties: true },
          createdAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "workspaceId",
          "actorUserId",
          "actionType",
          "entityType",
          "entityId",
          "createdAt",
        ],
      },
      ActivityListResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: { $ref: "#/components/schemas/ActivityEvent" },
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer" },
                  limit: { type: "integer" },
                  total: { type: "integer" },
                  totalPages: { type: "integer" },
                },
                required: ["page", "limit", "total", "totalPages"],
              },
            },
            required: ["items", "pagination"],
          },
        },
        required: ["data"],
      },
    },
  },
} as const;
