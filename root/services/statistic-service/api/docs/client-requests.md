# Statistic Service Client Request Spec

This document lists every public endpoint exposed by the Statistic Service and provides client request details and examples.

## Base URL

- Service root: `{STATISTIC_SERVICE_URL}`
- API base: `{STATISTIC_SERVICE_URL}/api`

## Authentication

- All `/api/*` routes require `Authorization: Bearer <token>`.
- `/health`, `/`, `/docs`, and `/docs.json` do not require auth.

## Common Headers

| Header | Required | Notes |
| --- | --- | --- |
| `Authorization` | Yes for `/api/*` | `Bearer <token>` |
| `x-request-id` | Optional | Correlation id for tracing |

## Endpoints

### GET /health

Health probe.

**Request**

```bash
curl -sS "{STATISTIC_SERVICE_URL}/health"
```

**200 Response**

```json
{
  "status": "ok",
  "uptimeMs": 12345
}
```

---

### GET /

Service welcome message.

**Request**

```bash
curl -sS "{STATISTIC_SERVICE_URL}/"
```

**200 Response**

```json
{
  "message": "Welcome to the Statistic Service API"
}
```

---

### GET /docs

Swagger UI for the Statistic Service.

**Request**

```bash
curl -sS "{STATISTIC_SERVICE_URL}/docs"
```

---

### GET /docs.json

OpenAPI JSON for the Statistic Service.

**Request**

```bash
curl -sS "{STATISTIC_SERVICE_URL}/docs.json"
```

---

### GET /api/statistics/{workspaceId}

Fetches summary metrics, activities, priorities, and workloads for a workspace.

**Path Parameters**

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `workspaceId` | `string` | Yes | Workspace identifier |

**Query Parameters**

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `range` | `"7d" | "30d" | "90d"` | No | Default: `7d` |

**Request**

```bash
curl -sS \
  -H "Authorization: Bearer <token>" \
  "{STATISTIC_SERVICE_URL}/api/statistics/42?range=30d"
```

**200 Response**

```json
{
  "data": {
    "range": "30d",
    "metrics": {
      "completed": 15,
      "updated": 42,
      "created": 25,
      "dueSoon": 8,
      "completedTrend": 10,
      "updatedTrend": -5,
      "createdTrend": 20,
      "dueSoonTrend": 0
    },
    "activities": [
      {
        "user": "user@example.com",
        "action": "card.created",
        "target": "Design new logo",
        "time": "Fri Oct 27 2023",
        "team": "Marketing",
        "status": "Created"
      }
    ],
    "priorities": [
      { "label": "Urgent", "value": 40, "color": "#ef4444" }
    ],
    "workloads": [
      { "name": "user@example.com", "capacity": 85, "state": "High Load" }
    ]
  }
}
```

**Error Responses**

- `400` validation error
- `401` unauthorized
- `500` statistics service error

**Troubleshooting**

- If you receive `200 OK` with an empty body, the handler was not able to serialize a response (for example, a proxy stripped the body or the client used `HEAD`). This endpoint always responds with JSON on success.

---

### GET /api/statistics/{workspaceId}/export

Exports statistics in either CSV or JSON format.

**Path Parameters**

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `workspaceId` | `string` | Yes | Workspace identifier |

**Query Parameters**

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `range` | `"7d" | "30d" | "90d"` | No | Default: `7d` |
| `format` | `"csv" | "json"` | No | Default: `csv` |

**Request (CSV)**

```bash
curl -sS \
  -H "Authorization: Bearer <token>" \
  "{STATISTIC_SERVICE_URL}/api/statistics/42/export?range=7d&format=csv"
```

**Request (JSON)**

```bash
curl -sS \
  -H "Authorization: Bearer <token>" \
  "{STATISTIC_SERVICE_URL}/api/statistics/42/export?range=7d&format=json"
```

**200 Response (application/json)**

```json
{
  "range": "7d",
  "metrics": {
    "completed": 15,
    "updated": 42,
    "created": 25,
    "dueSoon": 8,
    "completedTrend": 10,
    "updatedTrend": -5,
    "createdTrend": 20,
    "dueSoonTrend": 0
  },
  "activities": [
    {
      "user": "user@example.com",
      "action": "card.created",
      "target": "Design new logo",
      "time": "2023-10-27T10:00:00Z",
      "team": "Marketing",
      "status": "Created"
    }
  ],
  "priorities": [
    { "label": "Urgent", "value": 40, "color": "#ef4444" }
  ],
  "workloads": [
    { "name": "user@example.com", "capacity": 85, "state": "High Load" }
  ]
}
```

**200 Response (text/csv)**

```csv
--- METRICS ---
Category,Value,Trend (%)
completed,15,10
updated,42,-5
created,25,20
dueSoon,8,0

--- RECENT ACTIVITIES ---
User,Action,Target,Team,Status,Time
user@example.com,card.created,Design new logo,Marketing,Created,"Fri Oct 27 2023"

--- PRIORITIES ---
Label,Value (%),Color
Urgent,40,#ef4444

--- WORKLOADS ---
Name,Capacity (%),State
user@example.com,85,High Load
```

**Error Responses**

- `400` validation error
- `401` unauthorized
- `500` statistics export error

---

### GET /api/statistics/{workspaceId}/activities

Proxies activity service events for a workspace.

**Path Parameters**

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `workspaceId` | `string` | Yes | Workspace identifier |

**Query Parameters**

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `page` | `number` | No | Page number |
| `limit` | `number` | No | Max 100 |
| `actionType` | `string` | No | Example: `card.updated` |
| `entityType` | `string` | No | Example: `card` |
| `actorUserId` | `string` | No | User id filter |
| `from` | `string` | No | ISO date-time (inclusive) |
| `to` | `string` | No | ISO date-time (inclusive) |

**Request**

```bash
curl -sS \
  -H "Authorization: Bearer <token>" \
  "{STATISTIC_SERVICE_URL}/api/statistics/42/activities?page=1&limit=20"
```

**200 Response**

```json
{
  "data": {
    "items": [
      {
        "id": 1201,
        "publicId": "A1B2C3D4E5F6",
        "workspaceId": 42,
        "actorUserId": "2f9b2b0c-9d3a-4cc4-9eab-1e7dce1d2b1f",
        "actionType": "card.updated",
        "entityType": "card",
        "entityId": "card_98",
        "metadata": {
          "updatedFields": ["title", "dueDate"]
        },
        "createdAt": "2026-05-17T08:21:30.120Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**Error Responses**

- `400` validation error
- `401` unauthorized
- `403` forbidden
- `500` activity service error

---

### GET /api/statistics/{workspaceId}/self-performance

Returns completion and overdue totals for the current user, plus comparison with team.

**Path Parameters**

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `workspaceId` | `string` | Yes | Workspace identifier |

**Query Parameters**

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `range` | `"7d" | "30d" | "90d"` | No | Default: `7d` |

**Request**

```bash
curl -sS \
  -H "Authorization: Bearer <token>" \
  "{STATISTIC_SERVICE_URL}/api/statistics/42/self-performance?range=30d"
```

**200 Response**

```json
{
  "data": {
    "range": "30d",
    "completedTotal": 12,
    "overdueTotal": 3,
    "comparisonPercentage": 8,
    "completedPercentage": 75,
    "overdueTasks": [
      {
        "id": 101,
        "title": "Fix authentication bug",
        "dueDate": "2026-05-20T10:30:00Z"
      }
    ]
  }
}
```

**Error Responses**

- `400` validation error
- `401` unauthorized
- `403` invalid or expired token
- `500` statistics service error
