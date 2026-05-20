# Statistic Service

## Overview
Statistic Service aggregates board and workspace data and exposes it via a REST API.
It also supports exporting statistics data in both JSON and CSV formats.

## API Documentation

The API documentation is available in two formats:
- **Swagger UI**: `{statistic_service_url}/docs`
- **OpenAPI JSON**: `{statistic_service_url}/docs.json`

---

### Get Statistics

Returns metrics, activity, priorities, and workloads for the selected range.

- **Endpoint**: `GET /api/statistics/{workspaceId}`
- **Permissions**: `Authenticated`

**Parameters**

| Location | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| `path` | `workspaceId` | `string` | **Required**. Workspace identifier. |
| `query` | `range` | `string` | Time window for statistics. Can be `7d`, `30d`, or `90d`. Default: `7d`. |

**Responses**

- `200 OK`: Statistics payload.
- `400 Bad Request`: Invalid query parameters.
- `401 Unauthorized`: Missing or invalid token.

---

### Export Statistics

Exports statistics in either CSV or JSON format.

- **Endpoint**: `GET /api/statistics/{workspaceId}/export`
- **Permissions**: `Authenticated`

**Parameters**

| Location | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| `path` | `workspaceId` | `string` | **Required**. Workspace identifier. |
| `query` | `range` | `string` | Time window for statistics. Can be `7d`, `30d`, or `90d`. Default: `7d`. |
| `query` | `format` | `string` | Export format. Can be `csv` or `json`. Default: `csv`. |

**Responses**

- `200 OK (application/json)`: Returns the full statistics payload as a JSON file.
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

- `200 OK (text/csv)`: Returns a CSV file with statistics organized into sections.
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

- `400 Bad Request`: Invalid query parameters.
- `401 Unauthorized`: Missing or invalid token.

---

### Team Activity (Proxy)

Returns workspace activity events by calling the activity service internally.

- **Endpoint**: `GET /api/statistics/{workspaceId}/activities`
- **Permissions**: `Authenticated` (owner/admin only; enforced by activity service)

**Parameters**

| Location | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| `path` | `workspaceId` | `string` | **Required**. Workspace identifier. |
| `query` | `page` | `number` | Page number. Default: `1`. |
| `query` | `limit` | `number` | Page size. Default: `20`. Max: `100`. |
| `query` | `actionType` | `string` | Filter by action type (e.g., `card.updated`). |
| `query` | `entityType` | `string` | Filter by entity type (`board`, `card`). |
| `query` | `actorUserId` | `string` | Filter by actor user id. |
| `query` | `from` | `string` | ISO date-time (inclusive). |
| `query` | `to` | `string` | ISO date-time (inclusive). |

**Success Response**

- `200 OK`

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

- `400 Bad Request`
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters"
  }
}
```

- `401 Unauthorized`
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token"
  }
}
```

- `403 Forbidden`
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden"
  }
}
```

- `500 Internal Server Error`
```json
{
  "error": {
    "code": "ACTIVITY_ERROR",
    "message": "Failed to fetch activities"
  }
}
```

---

### Internal Service Call: Activity Service

Statistic service calls the activity service internally to fetch team activity data.

- **Method**: `GET`
- **Path**: `/api/activities/workspaces/{workspaceId}`
- **Service**: Activity Service
- **Purpose**: Proxy team activity events to the client.

**Request Headers**

| Name | Type | Description |
| :--- | :--- | :--- |
| `Authorization` | `string` | Bearer token forwarded from the client. |
| `x-request-id` | `string` | Optional request correlation id. |
| `x-user-id` | `string` | Optional user id for internal gateway auth. |

**Query Parameters**

| Name | Type | Description |
| :--- | :--- | :--- |
| `page` | `number` | Page number. Default: `1`. |
| `limit` | `number` | Page size. Default: `20`. Max: `100`. |
| `actionType` | `string` | Filter by action type (e.g., `card.updated`). |
| `entityType` | `string` | Filter by entity type (`board`, `card`). |
| `actorUserId` | `string` | Filter by actor user id. |
| `from` | `string` | ISO date-time (inclusive). |
| `to` | `string` | ISO date-time (inclusive). |

**Success Response**

- `200 OK`

```json
{
  "success": true,
  "message": "Success",
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

- `400 Bad Request`
```json
{
  "success": false,
  "message": "Invalid query parameters"
}
```

- `401 Unauthorized`
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

- `403 Forbidden`
```json
{
  "success": false,
  "message": "Forbidden"
}
```

- `500 Internal Server Error`
```json
{
  "success": false,
  "message": "Failed to fetch activities"
}
```

## Development
Run the service (from this folder):

```bash
pnpm install
pnpm dev
```

## Tests
```bash
pnpm test
```