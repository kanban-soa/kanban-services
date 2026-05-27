# UI Activity Spec (Card)

This document describes activity event payloads emitted by the board service for card adjustments.

## Envelope

All events are posted to the activity service using this envelope:

```json
{
  "workspaceId": 123,
  "actorUserId": "user-uuid",
  "actionType": "card.updated",
  "entityType": "card",
  "entityId": "card_public_id",
  "metadata": {
    "fields": ["title"]
  }
}
```

## Core Fields

- workspaceId: number
- actorUserId: string (UUID)
- actionType: "card.created" | "card.updated" | "card.deleted"
- entityType: "card"
- entityId: string (card public id)
- metadata: object | null

## Metadata Keys

Common keys used in card activity metadata:

- fields: string[]
- fromIndex: number
- toIndex: number
- fromListId: number
- toListId: number
- listId: string
- fromDueDate: string | null (ISO 8601)
- toDueDate: string | null (ISO 8601)
- labelId: number
- workspaceMemberPublicId: string

## Feature Mapping

### Card Created

- actionType: "card.created"
- metadata: (omitted)

Example:

```json
{
  "workspaceId": 123,
  "actorUserId": "user-uuid",
  "actionType": "card.created",
  "entityType": "card",
  "entityId": "card_public_id"
}
```

### Card Updated - Title / Description

- actionType: "card.updated"
- metadata.fields: ["title"] or ["description"]

Example:

```json
{
  "workspaceId": 123,
  "actorUserId": "user-uuid",
  "actionType": "card.updated",
  "entityType": "card",
  "entityId": "card_public_id",
  "metadata": {
    "fields": ["title"]
  }
}
```

### Card Updated - Due Date

- actionType: "card.updated"
- metadata.fields: ["dueDate"]
- metadata.fromDueDate: ISO string or null
- metadata.toDueDate: ISO string or null

Example:

```json
{
  "workspaceId": 123,
  "actorUserId": "user-uuid",
  "actionType": "card.updated",
  "entityType": "card",
  "entityId": "card_public_id",
  "metadata": {
    "fields": ["dueDate"],
    "fromDueDate": "2026-05-20T10:00:00.000Z",
    "toDueDate": "2026-05-28T10:00:00.000Z"
  }
}
```

### Card Updated - Move Within List (Index Change)

- actionType: "card.updated"
- metadata.fields: ["index"]
- metadata.fromIndex: number
- metadata.toIndex: number
- metadata.fromListId: number
- metadata.toListId: number (same list id)

Example:

```json
{
  "workspaceId": 123,
  "actorUserId": "user-uuid",
  "actionType": "card.updated",
  "entityType": "card",
  "entityId": "card_public_id",
  "metadata": {
    "fields": ["index"],
    "fromIndex": 2,
    "toIndex": 0,
    "fromListId": 55,
    "toListId": 55
  }
}
```

### Card Updated - Move Across Lists

- actionType: "card.updated"
- metadata.fields: ["list", "index"]
- metadata.fromIndex: number
- metadata.toIndex: number
- metadata.fromListId: number
- metadata.toListId: number

Example:

```json
{
  "workspaceId": 123,
  "actorUserId": "user-uuid",
  "actionType": "card.updated",
  "entityType": "card",
  "entityId": "card_public_id",
  "metadata": {
    "fields": ["list", "index"],
    "fromIndex": 1,
    "toIndex": 0,
    "fromListId": 55,
    "toListId": 56
  }
}
```

### Card Updated - Reorder List

- actionType: "card.updated"
- metadata.fields: ["index"]
- metadata.listId: string (list public id)

Example:

```json
{
  "workspaceId": 123,
  "actorUserId": "user-uuid",
  "actionType": "card.updated",
  "entityType": "card",
  "entityId": "card_public_id",
  "metadata": {
    "fields": ["index"],
    "listId": "list_public_id"
  }
}
```

### Card Updated - Label Added/Removed

- actionType: "card.updated"
- metadata.fields: ["label"]
- metadata.labelId: number

Example:

```json
{
  "workspaceId": 123,
  "actorUserId": "user-uuid",
  "actionType": "card.updated",
  "entityType": "card",
  "entityId": "card_public_id",
  "metadata": {
    "fields": ["label"],
    "labelId": 99
  }
}
```

### Card Updated - Member Added/Removed

- actionType: "card.updated"
- metadata.fields: ["member"]
- metadata.workspaceMemberPublicId: string

Example:

```json
{
  "workspaceId": 123,
  "actorUserId": "user-uuid",
  "actionType": "card.updated",
  "entityType": "card",
  "entityId": "card_public_id",
  "metadata": {
    "fields": ["member"],
    "workspaceMemberPublicId": "mem_42"
  }
}
```

### Card Deleted

- actionType: "card.deleted"
- metadata: (omitted)

Example:

```json
{
  "workspaceId": 123,
  "actorUserId": "user-uuid",
  "actionType": "card.deleted",
  "entityType": "card",
  "entityId": "card_public_id"
}
```

