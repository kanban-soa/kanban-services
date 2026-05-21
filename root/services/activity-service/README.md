# activity-service

Tracks workspace activity history for boards and cards.

## Endpoints

- `POST /internal/activities` — log activity events (service-to-service)
- `GET /api/activities/workspaces/:workspaceId` — list activity (admin/owner only)

## Environment

- `ACTIVITY_URL`
- `ACTIVITY_SERVICE_PORT`
- `WORKSPACE_SERVICE_URL`
- `ACTIVITY_RETENTION_DAYS` (optional, default 7)

## Smoke test

Run the service, then call the smoke script:

```bash
node scripts/smoke.js
```

## Internal Service Calls

### Workspace Service: Admin/Owner Check

Used by the activity list endpoint to authorize access.

- **Method**: `GET`
- **Path**: `/internal/workspaces/{workspaceId}/members/{userId}/authorization`
- **Service**: Workspace Service
- **Purpose**: Verify if the user is an admin or owner for the workspace.

**Request Headers**

| Name | Type | Description |
| :--- | :--- | :--- |
| `x-request-id` | `string` | Optional request correlation id. |

**Success Response**

- `200 OK`

```json
{
  "data": {
    "isAdmin": false,
    "isOwner": true
  }
}
```

**Error Responses**

- `401 Unauthorized`
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

- `404 Not Found`
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Workspace member not found"
  }
}
```

- `500 Internal Server Error`
```json
{
  "error": {
    "code": "SERVER_ERROR",
    "message": "Failed to verify workspace access"
  }
}
```
