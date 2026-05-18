export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Statistic Service API",
    version: "1.0.0",
    description: "API documentation for the statistic service.",
  },
  servers: [{ url: "/" }],
  paths: {
    "/api/statistics/{workspaceId}": {
      get: {
        summary: "Get statistics",
        description: "Returns metrics, activity, priorities, and workloads for the selected range.",
        tags: ["statistics"],
        security: [{ bearerAuth: [] }],
        parameters: [
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
            name: "x-request-id",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Optional request correlation id.",
          },
          {
            name: "x-user-id",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Optional user id for internal gateway auth.",
          },
        ],
        responses: {
          "200": {
            description: "Statistics payload",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/StatisticsResponse" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          "400": {
            description: "Invalid query parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Missing token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Invalid or expired token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Unexpected error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/statistics/{workspaceId}/export": {
      get: {
        summary: "Export statistics",
        description: "Exports metrics, activity, priorities, and workloads in CSV or JSON format.",
        tags: ["statistics"],
        security: [{ bearerAuth: [] }],
        parameters: [
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
          {
            name: "x-request-id",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Optional request correlation id.",
          },
          {
            name: "x-user-id",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Optional user id for internal gateway auth.",
          },
        ],
        responses: {
          "200": {
            description: "Exported statistics file",
            content: {
              "text/csv": {
                schema: { type: "string", format: "binary" },
              },
              "application/json": {
                schema: { $ref: "#/components/schemas/StatisticsResponse" },
              },
            },
          },
          "400": {
            description: "Invalid query parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Missing token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Invalid or expired token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Unexpected error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/statistics/{workspaceId}/activities": {
      get: {
        summary: "List workspace activities",
        description: "Returns activity events for a workspace (admin/owner only).",
        tags: ["statistics"],
        security: [{ bearerAuth: [] }],
        parameters: [
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
          {
            name: "x-request-id",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Optional request correlation id.",
          },
          {
            name: "x-user-id",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Optional user id for internal gateway auth.",
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
          "400": {
            description: "Invalid query parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Missing token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Forbidden",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Unexpected error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
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
    schemas: {
      StatisticsResponse: {
        type: "object",
        properties: {
          range: { type: "string", enum: ["7d", "30d", "90d"] },
          metrics: { $ref: "#/components/schemas/StatisticsMetrics" },
          activities: {
            type: "array",
            items: { $ref: "#/components/schemas/StatisticsActivity" },
          },
          priorities: {
            type: "array",
            items: { $ref: "#/components/schemas/StatisticsPriority" },
          },
          workloads: {
            type: "array",
            items: { $ref: "#/components/schemas/StatisticsWorkload" },
          },
        },
        required: ["range", "metrics", "activities", "priorities", "workloads"],
      },
      ActivityEvent: {
        type: "object",
        properties: {
          id: { type: "string" },
          publicId: { type: "string" },
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
      StatisticsMetrics: {
        type: "object",
        properties: {
          completed: { type: "number" },
          updated: { type: "number" },
          created: { type: "number" },
          dueSoon: { type: "number" },
          completedTrend: { type: "number" },
          updatedTrend: { type: "number" },
          createdTrend: { type: "number" },
          dueSoonTrend: { type: "number" },
        },
        required: [
          "completed",
          "updated",
          "created",
          "dueSoon",
          "completedTrend",
          "updatedTrend",
          "createdTrend",
          "dueSoonTrend",
        ],
      },
      StatisticsActivity: {
        type: "object",
        properties: {
          user: { type: "string" },
          action: { type: "string" },
          target: { type: "string" },
          time: { type: "string" },
          team: { type: "string" },
          status: { type: "string" },
        },
        required: ["user", "action", "target", "time", "team", "status"],
      },
      StatisticsPriority: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: "number" },
          color: { type: "string" },
        },
        required: ["label", "value", "color"],
      },
      StatisticsWorkload: {
        type: "object",
        properties: {
          name: { type: "string" },
          capacity: { type: "number" },
          state: { type: "string" },
        },
        required: ["name", "capacity", "state"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: { type: "object" },
            },
            required: ["code", "message"],
          },
        },
        required: ["error"],
      },
    },
  },
} as const;
