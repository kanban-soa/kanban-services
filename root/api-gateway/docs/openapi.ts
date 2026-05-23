export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Kanban API",
    version: "1.0.0",
    description:
      "API documentation for the Kanban platform. Endpoints exposed through the gateway are reachable on the default server (`/`). Endpoints that are owned by individual services (internal calls or routes not proxied through the gateway) are reachable on their respective service URLs.",
  },
  servers: [
    { url: "/", description: "Gateway (default)" },
    { url: "http://localhost:9001", description: "Auth service (direct)" },
    { url: "http://localhost:9002", description: "Statistic service (direct)" },
    { url: "http://localhost:9003", description: "Board service (direct)" },
    { url: "http://localhost:9004", description: "Noti service (direct)" },
    { url: "http://localhost:9005", description: "Workspace service (direct)" },
    { url: "http://localhost:9010", description: "Activity service (direct)" },
  ],
  tags: [
    { name: "gateway", description: "Gateway endpoints" },
    { name: "auth", description: "Auth service (proxied through gateway)" },
    { name: "auth-direct", description: "Auth service (direct, not proxied)" },
    { name: "workspaces", description: "Workspace service (proxied)" },
    { name: "workspace-members", description: "Workspace members (proxied)" },
    { name: "workspace-permissions", description: "Workspace permissions & roles (proxied)" },
    { name: "workspace-direct", description: "Workspace service (direct, internal)" },
    { name: "boards", description: "Board service – boards (proxied)" },
    { name: "lists", description: "Board service – lists (proxied)" },
    { name: "cards", description: "Board service – cards (proxied)" },
    { name: "labels", description: "Board service – labels (proxied)" },
    { name: "board-statistics", description: "Board service – statistics (proxied)" },
    { name: "notifications", description: "Notification service (proxied)" },
    { name: "statistics", description: "Statistic service (proxied)" },
    { name: "activity-direct", description: "Activity service (direct, no gateway route)" },
  ],
  paths: {
    // ─────────────────────────────────────────────────────────────────
    // GATEWAY
    // ─────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────
    // AUTH SERVICE — PROXIED THROUGH GATEWAY
    // Gateway rewrites:
    //   /api/v1/auth/login      → auth-service /api/users/login
    //   /api/v1/auth/register   → auth-service /api/users (POST)
    //   /api/v1/auth/verify-jwt → auth-service /api/sessions/verify-jwt
    //   /api/v1/auth/users/*    → auth-service /api/users/*
    // ─────────────────────────────────────────────────────────────────
    "/api/v1/auth/login": {
      post: {
        summary: "Login",
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
        summary: "Register a new user",
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
    "/api/v1/auth/users": {
      get: {
        summary: "List or look up users",
        description: "When `ids` is provided, returns the matching users. Otherwise, when `email` is provided, returns the user with that email.",
        tags: ["auth"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "ids", in: "query", schema: { type: "string" }, description: "Comma-separated list of user ids." },
          { name: "email", in: "query", schema: { type: "string" }, description: "Look up a single user by email." },
        ],
        responses: {
          "200": { description: "User(s) returned" },
          "401": { description: "Missing or invalid token" },
        },
      },
    },
    "/api/v1/auth/users/forgot-password": {
      post: {
        summary: "Request password reset",
        tags: ["auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { email: { type: "string", format: "email" } },
                required: ["email"],
              },
            },
          },
        },
        responses: { "200": { description: "Reset email queued" } },
      },
    },
    "/api/v1/auth/users/reset-password": {
      post: {
        summary: "Reset password using a token",
        tags: ["auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  token: { type: "string" },
                  password: { type: "string" },
                },
                required: ["token", "password"],
              },
            },
          },
        },
        responses: { "200": { description: "Password updated" }, "400": { description: "Invalid token" } },
      },
    },
    "/api/v1/auth/users/{id}": {
      get: {
        summary: "Get user by id",
        tags: ["auth"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "User" }, "404": { description: "Not found" } },
      },
      put: {
        summary: "Update user",
        tags: ["auth"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete user",
        tags: ["auth"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" } },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // AUTH SERVICE — DIRECT (NOT PROXIED THROUGH GATEWAY)
    // Sessions/accounts/verifications are only reachable on port 9001.
    // ─────────────────────────────────────────────────────────────────
    "/api/sessions": {
      post: {
        summary: "Create session",
        tags: ["auth-direct"],
        servers: [{ url: "http://localhost:9001" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { userId: { type: "string" } }, required: ["userId"] },
            },
          },
        },
        responses: { "201": { description: "Session created" } },
      },
    },
    "/api/sessions/refresh": {
      post: {
        summary: "Refresh access token",
        tags: ["auth-direct"],
        servers: [{ url: "http://localhost:9001" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { refreshToken: { type: "string" } }, required: ["refreshToken"] },
            },
          },
        },
        responses: { "200": { description: "New access token" } },
      },
    },
    "/api/sessions/logout": {
      post: {
        summary: "Logout (invalidate refresh token)",
        tags: ["auth-direct"],
        servers: [{ url: "http://localhost:9001" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { refreshToken: { type: "string" } }, required: ["refreshToken"] },
            },
          },
        },
        responses: { "204": { description: "Logged out" } },
      },
    },
    "/api/sessions/verify-jwt": {
      post: {
        summary: "Verify JWT (direct)",
        description: "Same handler as the proxied `/api/v1/auth/verify-jwt`; exposed directly for service-to-service callers.",
        tags: ["auth-direct"],
        servers: [{ url: "http://localhost:9001" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyJwtRequest" },
            },
          },
        },
        responses: { "200": { description: "Token is valid" }, "401": { description: "Invalid token" } },
      },
    },
    "/api/sessions/{token}": {
      get: {
        summary: "Get session by token",
        tags: ["auth-direct"],
        servers: [{ url: "http://localhost:9001" }],
        parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Session" } },
      },
    },
    "/api/sessions/{token}/user": {
      get: {
        summary: "Get session with user data",
        tags: ["auth-direct"],
        servers: [{ url: "http://localhost:9001" }],
        parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Session + user" } },
      },
    },
    "/api/sessions/{id}": {
      delete: {
        summary: "Delete a session",
        tags: ["auth-direct"],
        servers: [{ url: "http://localhost:9001" }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/api/sessions/user/{userId}": {
      delete: {
        summary: "Delete all sessions for a user",
        tags: ["auth-direct"],
        servers: [{ url: "http://localhost:9001" }],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/api/sessions/accounts": {
      post: {
        summary: "Link external account",
        tags: ["auth-direct"],
        servers: [{ url: "http://localhost:9001" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "string" },
                  providerId: { type: "string" },
                  accountData: { type: "object", additionalProperties: true },
                },
                required: ["userId", "providerId"],
              },
            },
          },
        },
        responses: { "201": { description: "Linked" } },
      },
    },
    "/api/sessions/accounts/{userId}/{providerId}": {
      delete: {
        summary: "Unlink external account",
        tags: ["auth-direct"],
        servers: [{ url: "http://localhost:9001" }],
        parameters: [
          { name: "userId", in: "path", required: true, schema: { type: "string" } },
          { name: "providerId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "204": { description: "Unlinked" } },
      },
    },
    "/api/sessions/accounts/{userId}": {
      get: {
        summary: "List linked accounts for a user",
        tags: ["auth-direct"],
        servers: [{ url: "http://localhost:9001" }],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Accounts" } },
      },
    },
    "/api/sessions/verifications": {
      post: {
        summary: "Create a verification code",
        tags: ["auth-direct"],
        servers: [{ url: "http://localhost:9001" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  type: { type: "string" },
                },
                required: ["email", "type"],
              },
            },
          },
        },
        responses: { "201": { description: "Code created" } },
      },
    },
    "/api/sessions/verifications/verify": {
      post: {
        summary: "Verify a verification code",
        tags: ["auth-direct"],
        servers: [{ url: "http://localhost:9001" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { email: { type: "string", format: "email" }, code: { type: "string" } },
                required: ["email", "code"],
              },
            },
          },
        },
        responses: { "200": { description: "Verified" }, "400": { description: "Invalid code" } },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // WORKSPACE SERVICE — PROXIED THROUGH GATEWAY
    // Gateway: /api/v1/workspaces/* → workspace-service /api/workspaces/*
    // ─────────────────────────────────────────────────────────────────
    "/api/v1/workspaces": {
      get: {
        summary: "List workspaces for the current user",
        tags: ["workspaces"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Workspace list" } },
      },
      post: {
        summary: "Create workspace",
        tags: ["workspaces"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  icon: { type: "string" },
                },
                required: ["name"],
              },
            },
          },
        },
        responses: { "201": { description: "Workspace created" } },
      },
    },
    "/api/v1/workspaces/invitations": {
      get: {
        summary: "List the current user's pending invitations",
        tags: ["workspaces"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Invitation list" } },
      },
    },
    "/api/v1/workspaces/{id}": {
      get: {
        summary: "Get workspace by id",
        tags: ["workspaces"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Workspace" } },
      },
      patch: {
        summary: "Update workspace",
        tags: ["workspaces"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  icon: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete workspace",
        tags: ["workspaces"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/api/v1/workspaces/{id}/members": {
      get: {
        summary: "List members of a workspace",
        tags: ["workspace-members"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Members" } },
      },
      post: {
        summary: "Invite a member",
        tags: ["workspace-members"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  role: { type: "string" },
                },
                required: ["email"],
              },
            },
          },
        },
        responses: { "201": { description: "Invitation sent" } },
      },
    },
    "/api/v1/workspaces/{id}/members/invitation": {
      get: {
        summary: "List pending invitations for a workspace",
        tags: ["workspace-members"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Invitations" } },
      },
    },
    "/api/v1/workspaces/{id}/members/invitation/{invitationId}": {
      delete: {
        summary: "Cancel an invitation",
        tags: ["workspace-members"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "invitationId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "204": { description: "Cancelled" } },
      },
    },
    "/api/v1/workspaces/{id}/members/summary": {
      post: {
        summary: "Bulk member summary",
        tags: ["workspace-members"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { memberIds: { type: "array", items: { type: "string" } } },
                required: ["memberIds"],
              },
            },
          },
        },
        responses: { "200": { description: "Summaries" } },
      },
    },
    "/api/v1/workspaces/{id}/members/{memberId}": {
      get: {
        summary: "Get member details",
        tags: ["workspace-members"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "memberId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "Member" } },
      },
      patch: {
        summary: "Update member role",
        tags: ["workspace-members"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "memberId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { role: { type: "string" } }, required: ["role"] },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Remove a member",
        tags: ["workspace-members"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "memberId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "204": { description: "Removed" } },
      },
    },
    "/api/v1/workspaces/{id}/permissions": {
      get: {
        summary: "List workspace permissions (or check a single one via ?permission=)",
        tags: ["workspace-permissions"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "permission", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Permissions / check result" } },
      },
      post: {
        summary: "Check a permission (POST form)",
        tags: ["workspace-permissions"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  permission: { type: "string" },
                  userId: { type: "string" },
                },
                required: ["permission"],
              },
            },
          },
        },
        responses: { "200": { description: "Check result" } },
      },
    },
    "/api/v1/workspaces/{id}/roles": {
      get: {
        summary: "List workspace roles",
        tags: ["workspace-permissions"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Roles" } },
      },
      post: {
        summary: "Create a role",
        tags: ["workspace-permissions"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  permissions: { type: "array", items: { type: "string" } },
                },
                required: ["name"],
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/workspaces/{id}/roles/{roleId}/permissions": {
      get: {
        summary: "List permissions on a role",
        tags: ["workspace-permissions"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "roleId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "Permissions" } },
      },
      post: {
        summary: "Grant a permission to a role",
        tags: ["workspace-permissions"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "roleId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { permission: { type: "string" } },
                required: ["permission"],
              },
            },
          },
        },
        responses: { "201": { description: "Granted" } },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // WORKSPACE SERVICE — DIRECT (INTERNAL ONLY)
    // ─────────────────────────────────────────────────────────────────
    "/internal/workspaces/{workspaceId}/members/{userId}/authorization": {
      get: {
        summary: "Internal: get a user's authorization in a workspace",
        description: "Used by other services (board, statistic) to validate a user belongs to a workspace and resolve their role. Not exposed through the gateway.",
        tags: ["workspace-direct"],
        servers: [{ url: "http://localhost:9005" }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "userId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "Authorization payload" }, "404": { description: "Not a member" } },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // BOARD SERVICE — PROXIED THROUGH GATEWAY (/api/v1/boards/* → /api/boards/*)
    // ─────────────────────────────────────────────────────────────────
    "/api/v1/boards": {
      post: {
        summary: "Create a board",
        description: "Creates a board in the workspace identified by `workspaceId` in the request body.",
        tags: ["boards"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  workspaceId: { type: "number" },
                  name: { type: "string" },
                  description: { type: "string" },
                },
                required: ["workspaceId", "name"],
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/boards/all": {
      post: {
        summary: "List boards in a workspace",
        description: "Returns all boards in the workspace identified by `workspaceId` in the request body.",
        tags: ["boards"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { workspaceId: { type: "number" } },
                required: ["workspaceId"],
              },
            },
          },
        },
        responses: { "200": { description: "Boards" } },
      },
    },
    "/api/v1/boards/{boardId}": {
      get: {
        summary: "Get board detail",
        tags: ["boards"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "boardId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Board" } },
      },
      patch: {
        summary: "Update board",
        tags: ["boards"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "boardId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete board",
        description: "Requires `workspaceId` in the request body.",
        tags: ["boards"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "boardId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { workspaceId: { type: "number" } },
                required: ["workspaceId"],
              },
            },
          },
        },
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/api/v1/boards/{boardId}/lists": {
      post: {
        summary: "Create a list (column) on a board",
        tags: ["lists"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "boardId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  position: { type: "number" },
                },
                required: ["name"],
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/boards/lists/{listId}": {
      patch: {
        summary: "Update list",
        tags: ["lists"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "listId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { name: { type: "string" }, position: { type: "number" } },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete list",
        tags: ["lists"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "listId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/api/v1/boards/lists/{listId}/cards": {
      post: {
        summary: "Create a card on a list",
        tags: ["cards"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "listId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { title: { type: "string" }, description: { type: "string" } },
                required: ["title"],
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/boards/cards/{cardId}": {
      get: {
        summary: "Get card",
        tags: ["cards"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "cardId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Card" } },
      },
      patch: {
        summary: "Update card (title/description or move to another list)",
        tags: ["cards"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "cardId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  targetListId: { type: "string" },
                  newIndex: { type: "number" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete card",
        tags: ["cards"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "cardId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/api/v1/boards/cards/{cardId}/labels": {
      post: {
        summary: "Attach a label to a card",
        tags: ["cards"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "cardId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { labelId: { type: "string" } },
                required: ["labelId"],
              },
            },
          },
        },
        responses: { "201": { description: "Attached" } },
      },
    },
    "/api/v1/boards/cards/{cardId}/labels/{labelId}": {
      delete: {
        summary: "Detach a label from a card",
        tags: ["cards"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "cardId", in: "path", required: true, schema: { type: "string" } },
          { name: "labelId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "204": { description: "Detached" } },
      },
    },
    "/api/v1/boards/cards/{cardId}/due-date": {
      patch: {
        summary: "Set/update card due date",
        tags: ["cards"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "cardId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { dueDate: { type: "string", format: "date-time" } },
                required: ["dueDate"],
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Clear card due date",
        tags: ["cards"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "cardId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Cleared" } },
      },
    },
    "/api/v1/boards/cards/{cardId}/members": {
      post: {
        summary: "Assign a workspace member to a card",
        tags: ["cards"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "cardId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { workspaceMemberPublicId: { type: "string" } },
                required: ["workspaceMemberPublicId"],
              },
            },
          },
        },
        responses: { "201": { description: "Assigned" } },
      },
    },
    "/api/v1/boards/cards/{cardId}/members/{memberId}": {
      delete: {
        summary: "Remove a member from a card",
        tags: ["cards"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "cardId", in: "path", required: true, schema: { type: "string" } },
          { name: "memberId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "204": { description: "Removed" } },
      },
    },
    "/api/v1/boards/{boardId}/labels": {
      get: {
        summary: "List labels on a board",
        tags: ["labels"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "boardId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Labels" } },
      },
    },
    "/api/v1/boards/{boardId}/labels/{labelId}": {
      patch: {
        summary: "Update a label",
        tags: ["labels"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "boardId", in: "path", required: true, schema: { type: "string" } },
          { name: "labelId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { name: { type: "string" }, color: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete a label",
        tags: ["labels"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "boardId", in: "path", required: true, schema: { type: "string" } },
          { name: "labelId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/api/v1/boards/statistics/metrics": {
      get: {
        summary: "Board metrics (used by statistic-service)",
        tags: ["board-statistics"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Metrics" } },
      },
    },
    "/api/v1/boards/statistics/activities": {
      get: {
        summary: "Card activities (used by statistic-service)",
        tags: ["board-statistics"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Activities" } },
      },
    },
    "/api/v1/boards/statistics/priorities": {
      get: {
        summary: "Priority distribution (used by statistic-service)",
        tags: ["board-statistics"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Priorities" } },
      },
    },
    "/api/v1/boards/statistics/workloads": {
      get: {
        summary: "Member workloads (used by statistic-service)",
        tags: ["board-statistics"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Workloads" } },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // NOTIFICATION SERVICE — PROXIED THROUGH GATEWAY
    // ─────────────────────────────────────────────────────────────────
    "/api/v1/notifications": {
      get: {
        summary: "List the current user's notifications",
        tags: ["notifications"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
          { name: "unread", in: "query", schema: { type: "string", enum: ["true", "false", "1", "0"] } },
        ],
        responses: {
          "200": {
            description: "Notifications",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: { type: "array", items: { $ref: "#/components/schemas/Notification" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a notification (used by other services)",
        tags: ["notifications"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateNotificationRequest" },
            },
          },
        },
        responses: { "201": { description: "Created" }, "400": { description: "Missing fields" } },
      },
    },
    "/api/v1/notifications/unread-count": {
      get: {
        summary: "Number of unread notifications for the current user",
        tags: ["notifications"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Count",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { count: { type: "integer" } },
                  required: ["count"],
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/notifications/read-all": {
      patch: {
        summary: "Mark all notifications as read",
        tags: ["notifications"],
        security: [{ bearerAuth: [] }],
        responses: { "204": { description: "OK" } },
      },
    },
    "/api/v1/notifications/{publicId}/read": {
      patch: {
        summary: "Mark one notification as read",
        tags: ["notifications"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "publicId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Updated" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/v1/notifications/{publicId}": {
      delete: {
        summary: "Soft-delete a notification",
        tags: ["notifications"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "publicId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" }, "404": { description: "Not found" } },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // STATISTIC SERVICE — PROXIED THROUGH GATEWAY
    // ─────────────────────────────────────────────────────────────────
    "/api/v1/statistics/{workspaceId}": {
      get: {
        summary: "Get workspace statistics",
        tags: ["statistics"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          {
            name: "range",
            in: "query",
            schema: { type: "string", enum: ["7d", "30d", "90d"], default: "7d" },
          },
        ],
        responses: { "200": { description: "Statistics payload" } },
      },
    },
    "/api/v1/statistics/{workspaceId}/export": {
      get: {
        summary: "Export statistics (CSV or JSON)",
        tags: ["statistics"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          {
            name: "range",
            in: "query",
            schema: { type: "string", enum: ["7d", "30d", "90d"], default: "7d" },
          },
          {
            name: "format",
            in: "query",
            schema: { type: "string", enum: ["csv", "json"], default: "csv" },
          },
        ],
        responses: { "200": { description: "Exported file" } },
      },
    },
    "/api/v1/statistics/{workspaceId}/activities": {
      get: {
        summary: "List workspace activity (admin/owner only)",
        tags: ["statistics"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          { name: "actionType", in: "query", schema: { type: "string" } },
          { name: "entityType", in: "query", schema: { type: "string" } },
          { name: "actorUserId", in: "query", schema: { type: "string" } },
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
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
    "/api/v1/statistics/{workspaceId}/self-performance": {
      get: {
        summary: "Get self performance statistics",
        tags: ["statistics"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "range", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d"], default: "7d" } },
        ],
        responses: {
          "200": {
            description: "Self performance payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SelfPerformanceResponse" },
              },
            },
          },
          "401": { description: "Missing or invalid token" },
        },
      },
    },

    // ─────────────────────────────────────────────────────────────────
    // ACTIVITY SERVICE — DIRECT (NO GATEWAY ROUTE)
    // ─────────────────────────────────────────────────────────────────
    "/internal/activities": {
      post: {
        summary: "Internal: log an activity event",
        description: "Called by board-service (and other services) to record an action. Not exposed through the gateway.",
        tags: ["activity-direct"],
        servers: [{ url: "http://localhost:9010" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  workspaceId: { type: "number" },
                  actorUserId: { type: "string" },
                  actionType: { type: "string" },
                  entityType: { type: "string" },
                  entityId: { type: "string" },
                  metadata: { type: "object", additionalProperties: true, nullable: true },
                },
                required: ["workspaceId", "actorUserId", "actionType", "entityType", "entityId"],
              },
            },
          },
        },
        responses: { "201": { description: "Logged" } },
      },
    },
    "/api/activities/workspaces/{workspaceId}": {
      get: {
        summary: "List activities for a workspace",
        description: "Direct activity-service endpoint. Not currently proxied through the gateway.",
        tags: ["activity-direct"],
        servers: [{ url: "http://localhost:9010" }],
        parameters: [{ name: "workspaceId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Activity list" } },
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
        properties: { token: { type: "string" } },
        required: ["token"],
      },
      Notification: {
        type: "object",
        properties: {
          publicId: { type: "string" },
          type: { type: "string" },
          userId: { type: "string", format: "uuid" },
          cardId: { type: "string", format: "uuid" },
          commentId: { type: "string", format: "uuid" },
          workspaceId: { type: "string", format: "uuid" },
          metadata: { type: "string", nullable: true },
          read: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          deletedAt: { type: "string", format: "date-time", nullable: true },
        },
        required: ["publicId", "type", "userId", "read", "createdAt"],
      },
      CreateNotificationRequest: {
        type: "object",
        properties: {
          type: { type: "string" },
          userId: { type: "string", format: "uuid" },
          cardId: { type: "string", format: "uuid" },
          commentId: { type: "string", format: "uuid" },
          workspaceId: { type: "string", format: "uuid" },
          metadata: { type: "object", additionalProperties: true, nullable: true },
        },
        required: ["type", "userId", "cardId", "commentId", "workspaceId"],
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
      SelfPerformanceResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              range: { type: "string", enum: ["7d", "30d", "90d"] },
              completedTotal: { type: "number" },
              overdueTotal: { type: "number" },
              comparisonPercentage: { type: "number" },
              completedPercentage: { type: "number" },
              overdueTasks: {
                type: "array",
                items: { $ref: "#/components/schemas/OverdueTask" },
              },
            },
            required: [
              "range",
              "completedTotal",
              "overdueTotal",
              "comparisonPercentage",
              "completedPercentage",
              "overdueTasks",
            ],
          },
        },
        required: ["data"],
      },
      OverdueTask: {
        type: "object",
        properties: {
          id: { type: "number" },
          title: { type: "string" },
          dueDate: { type: "string", format: "date-time" },
        },
        required: ["id", "title", "dueDate"],
      },
    },
  },
} as const;
