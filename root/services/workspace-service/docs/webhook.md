# Workspace Service - Webhook Events

## Overview

The Workspace Service uses an event-driven architecture for inter-service communication. Webhooks enable asynchronous communication between the Workspace Service and other microservices (Auth Service, Card Service, etc.).

## Event Categories

### 1. Inbound Events (Events Workspace Service Listens to)

#### 1.1 User Lifecycle Events (from Auth Service)

**Event: `user.created`**
- **Source**: Auth Service
- **Trigger**: User account is created in Auth Service
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "user.created",
    "timestamp": "ISO8601",
    "userId": "uuid",
    "email": "string",
    "name": "string"
  }
  ```
- **Action**: Cache user information for reference in workspace members
- **Internal Validation**:
  - Validate userId format (valid UUID)
  - Validate email format
  - Check for duplicate user caches

**Event: `user.updated`**
- **Source**: Auth Service
- **Trigger**: User profile is updated
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "user.updated",
    "timestamp": "ISO8601",
    "userId": "uuid",
    "email": "string",
    "name": "string",
    "changes": {
      "email": { "from": "old@example.com", "to": "new@example.com" },
      "name": { "from": "Old Name", "to": "New Name" }
    }
  }
  ```
- **Action**: Update email in workspace_members if email changed
- **Internal Validation**:
  - Validate userId existence in workspace_members
  - Verify new email format if email changed
  - Check for email uniqueness within workspace (if applicable)

**Event: `user.deleted`**
- **Source**: Auth Service
- **Trigger**: User account is permanently deleted
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "user.deleted",
    "timestamp": "ISO8601",
    "userId": "uuid"
  }
  ```
- **Action**: 
  - Mark workspace_members with this userId as deleted (soft delete)
  - Log deletion with deletedAt and deletedBy timestamp
- **Internal Validation**:
  - Validate userId format
  - Check if userId exists in workspace_members before marking deleted
  - Ensure idempotency (handle duplicate events)
  - Audit trail: record who/when initiated deletion

#### 1.2 Workspace Invitation Events (from External Service or Internal)

**Event: `workspace.invitation.accepted`**
- **Source**: Auth Service (after user accepts invitation)
- **Trigger**: User accepts workspace invitation via email/link
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "workspace.invitation.accepted",
    "timestamp": "ISO8601",
    "workspaceMemberId": "bigint",
    "userId": "uuid"
  }
  ```
- **Action**: 
  - Update workspace_members.status from "invited" to "active"
  - Update workspace_members.userId if previously null
- **Internal Validation**:
  - Validate workspaceMemberId exists
  - Validate userId format
  - Check member status is "invited" before transition
  - Ensure member is not already deleted

**Event: `workspace.invitation.rejected`**
- **Source**: Auth Service
- **Trigger**: User rejects workspace invitation
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "workspace.invitation.rejected",
    "timestamp": "ISO8601",
    "workspaceMemberId": "bigint"
  }
  ```
- **Action**: Mark workspace_members as deleted with reason "invitation_rejected"
- **Internal Validation**:
  - Validate workspaceMemberId exists
  - Check member status is "invited"
  - Prevent rejection of already active members

---

### 2. Outbound Events (Events Workspace Service Publishes)

#### 2.1 Workspace Management Events

**Event: `workspace.created`**
- **Trigger**: POST /workspaces - User creates new workspace
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "workspace.created",
    "timestamp": "ISO8601",
    "workspaceId": "bigint",
    "publicId": "string",
    "name": "string",
    "slug": "string",
    "plan": "free|pro|enterprise",
    "createdBy": "uuid"
  }
  ```
- **Consumers**: 
  - Billing Service (initialize billing account)
  - Analytics Service (track workspace creation)

**Event: `workspace.updated`**
- **Trigger**: PATCH /workspaces/{id} - Workspace details updated
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "workspace.updated",
    "timestamp": "ISO8601",
    "workspaceId": "bigint",
    "changes": {
      "name": { "from": "Old", "to": "New" },
      "slug": { "from": "old-slug", "to": "new-slug" }
    }
  }
  ```
- **Consumers**: Analytics Service, Search Service (if exists)

**Event: `workspace.deleted`**
- **Trigger**: DELETE /workspaces/{id} - Workspace is deleted
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "workspace.deleted",
    "timestamp": "ISO8601",
    "workspaceId": "bigint",
    "publicId": "string",
    "deletedBy": "uuid"
  }
  ```
- **Consumers**: Billing Service (cleanup subscription), Card Service (cascade delete), Analytics Service
- **Note**: Actual database deletion may be deferred; soft delete with cascading cleanup scheduled

**Event: `workspace.plan.changed`**
- **Trigger**: Subscription/Plan upgrade or downgrade
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "workspace.plan.changed",
    "timestamp": "ISO8601",
    "workspaceId": "bigint",
    "oldPlan": "free|pro|enterprise",
    "newPlan": "free|pro|enterprise",
    "changedBy": "uuid"
  }
  ```
- **Consumers**: Billing Service, Feature Service (enable/disable features)

#### 2.2 Member Management Events

**Event: `member.invited`**
- **Trigger**: POST /workspaces/{id}/members - Admin invites new member
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "member.invited",
    "timestamp": "ISO8601",
    "workspaceId": "bigint",
    "workspaceMemberId": "bigint",
    "email": "string",
    "role": "admin|member|guest",
    "invitedBy": "uuid"
  }
  ```
- **Consumers**: 
  - Auth Service (send invitation email)
  - Notification Service (notify inviter of invitation sent)

**Event: `member.added`**
- **Trigger**: Member accepts invitation or admin directly adds member
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "member.added",
    "timestamp": "ISO8601",
    "workspaceId": "bigint",
    "workspaceMemberId": "bigint",
    "userId": "uuid",
    "email": "string",
    "role": "admin|member|guest",
    "status": "active|invited|paused",
    "addedBy": "uuid"
  }
  ```
- **Consumers**: 
  - Analytics Service (track membership)
  - Notification Service (notify workspace members)
  - Audit Service

**Event: `member.role.changed`**
- **Trigger**: PATCH /workspaces/{id}/members?userId=X - Admin changes member role
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "member.role.changed",
    "timestamp": "ISO8601",
    "workspaceId": "bigint",
    "workspaceMemberId": "bigint",
    "userId": "uuid",
    "oldRole": "admin|member|guest",
    "newRole": "admin|member|guest",
    "changedBy": "uuid"
  }
  ```
- **Consumers**: 
  - Audit Service
  - Notification Service (notify member of role change)
  - Permission Cache Service (invalidate caches)

**Event: `member.removed`**
- **Trigger**: DELETE /workspaces/{id}/members?userId=X - Member is removed
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "member.removed",
    "timestamp": "ISO8601",
    "workspaceId": "bigint",
    "workspaceMemberId": "bigint",
    "userId": "uuid",
    "role": "admin|member|guest",
    "removedBy": "uuid",
    "reason": "optional string"
  }
  ```
- **Consumers**: 
  - Analytics Service
  - Audit Service
  - Notification Service
  - Card Service (revoke access to boards/cards)

#### 2.3 Permission Events

**Event: `permissions.updated`**
- **Trigger**: POST/PUT /workspaces/{id}/permissions - Workspace permissions changed
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "eventType": "permissions.updated",
    "timestamp": "ISO8601",
    "workspaceId": "bigint",
    "roleId": "bigint",
    "permissions": {
      "canEdit": true,
      "canDelete": false,
      "canManageMembers": true
    },
    "updatedBy": "uuid"
  }
  ```
- **Consumers**: 
  - Permission Cache Service
  - Audit Service

---

## Event Processing

### Webhook Delivery Guarantee

- **At-Least-Once**: Events are delivered at least once; consumers must handle idempotency
- **Timeout**: 30 seconds per webhook call
- **Retries**: Exponential backoff - 3 attempts within 5 minutes
- **Dead Letter Queue**: Failed events after retries are logged to DLQ for manual review

### Event Ordering

- **Per Aggregate**: Events for the same workspace are ordered
- **Cross-Aggregate**: Event ordering not guaranteed between different workspaces

### Internal Validation Rules

#### User-Related Events
```typescript
// Validate user.deleted event
1. Check userId is valid UUID format
2. Verify userId exists in workspace_members table
3. Find all workspace_members records with this userId
4. For each member:
   - Check current status is not "removed" or "deleted"
   - Mark as deleted with soft delete (deletedAt = now, deletedBy = system)
   - Create audit log entry
5. Ensure idempotency: if already deleted, log warning and return success
6. Publish member.removed events for each deleted membership
```

#### Member Invitation Events
```typescript
// Validate workspace.invitation.accepted event
1. Check workspaceMemberId is valid bigint format
2. Query workspace_members for this ID
3. Verify record exists and status = "invited"
4. Verify userId matches (if previously null, set it)
5. Check workspace still exists (not deleted)
6. Update status to "active"
7. Update invitedAt timestamp
8. Create audit log entry
9. Publish member.added event
```

#### Role Change Events
```typescript
// Validate member.role.changed event
1. Verify old role and new role are valid enum values
2. Check member exists and is not deleted
3. Verify workspace exists
4. Check that role change doesn't violate constraints:
   - At least one admin per workspace (if changing last admin to member)
5. Update role
6. Create audit log entry
7. Invalidate permission caches
```

### Error Handling

```typescript
// Webhook error responses
200 OK: Event processed successfully
202 Accepted: Event queued for processing
400 Bad Request: Invalid event structure (missing required fields)
409 Conflict: Business logic violation (e.g., cannot delete last admin)
422 Unprocessable Entity: Internal validation failed
500 Internal Server Error: Unexpected server error (will retry)
503 Service Unavailable: Temporary issue (will retry)
```

---

## Webhook Configuration

### Inbound Webhook Endpoint

```
POST /webhooks/events
Content-Type: application/json
X-Event-Id: {eventId}
X-Event-Type: {eventType}
X-Signature: HMAC-SHA256(payload, secret)
```

### Outbound Webhook Registration

Services can register webhooks via:

```typescript
// Register for workspace.created events
POST /webhooks/subscribe
{
  "serviceName": "billing-service",
  "url": "http://billing-service:3002/webhooks/workspace.created",
  "eventTypes": ["workspace.created", "workspace.plan.changed"],
  "retryPolicy": {
    "maxRetries": 3,
    "timeout": 30000,
    "backoff": "exponential"
  }
}
```

---

## Event Monitoring

### Metrics to Track

- Event processing latency (p50, p95, p99)
- Event processing errors by type
- Dead letter queue size
- Consumer lag (time from event publication to processing)
- Event volume by type

### Logging

All events are logged with:
- Event ID (for correlation)
- Event type
- Timestamp
- Processing duration
- Success/failure status
- Error details (if failed)

### Example Log Entry

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "eventId": "evt_123abc",
  "eventType": "member.invited",
  "workspaceId": 42,
  "status": "success",
  "processingDurationMs": 145,
  "consumer": "auth-service"
}
```

---

## Development Guide

### Testing Webhooks Locally

```bash
# Start webhook receiver for testing
npm run webhook:test

# Mock incoming event
curl -X POST http://localhost:3001/webhooks/events \
  -H "Content-Type: application/json" \
  -H "X-Event-Type: user.deleted" \
  -d '{
    "eventId": "evt_test_123",
    "eventType": "user.deleted",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2024-01-15T10:30:45Z"
  }'

# View webhook logs
npm run logs:webhooks
```

### Publishing Test Events

```typescript
// In tests
import { publishEvent } from './webhooks/publisher';

test('member removal triggers notification', async () => {
  await publishEvent('member.removed', {
    workspaceId: 1,
    workspaceMemberId: 100,
    userId: 'user-uuid',
    removedBy: 'admin-uuid'
  });
  
  // Assert notification was sent
});
```
