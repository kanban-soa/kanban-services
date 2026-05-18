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
