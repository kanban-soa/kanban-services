export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Statistic Service API",
    version: "1.0.0",
    description: "API documentation for the statistic service.",
  },
  servers: [{ url: "/" }],
  paths: {
    "/api/v1/statistics": {
      get: {
        summary: "Get statistics",
        description: "Returns metrics, activity, priorities, and workloads for the selected range.",
        tags: ["statistics"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "range",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["7d", "30d", "90d"], default: "7d" },
            description: "Time window for statistics.",
          },
          {
            name: "workspaceId",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Workspace identifier.",
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

