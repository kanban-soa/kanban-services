# BOARD SERVICE API SPECIFICATION

## 1. Overview

Tài liệu này định nghĩa đặc tả API cho `board-service` trong hệ thống Kanban theo kiến trúc Microservice.

**Board Service chịu trách nhiệm:**
- Boards
- Lists
- Cards
- Labels
- Card Members
- Due Dates
- Card Activities

**Workspace Service chịu trách nhiệm:**
- Workspace
- Workspace Members
- Roles
- Permissions

Board Service **không** xác thực JWT trực tiếp. Xác thực và context được xử lý ở API Gateway.

---

## 2. Architecture Flow

```txt
Client
→ API Gateway
→ Board Service
→ Workspace Service (internal HTTP)
```

Luồng chuẩn:
1. Client gửi request kèm JWT.
2. API Gateway verify JWT, resolve workspace context.
3. Gateway inject headers (`x-user-id`, `x-workspace-id`, `x-role`) xuống Board Service.
4. Board Service xử lý domain board/list/card.
5. Khi cần xác thực workspace/member/permission, Board Service gọi internal APIs sang Workspace Service.

---

## 3. Authentication & Context

- JWT được verify tại API Gateway.
- Board Service chỉ tin cậy các header context do Gateway inject.
- Workspace context **không truyền qua URL path** cho external APIs.

Ví dụ header context:

```http
x-user-id: user_1
x-workspace-id: workspace_1
x-role: member
```

---

## 4. Base URL

- **External Board APIs:** `/api/v1`
- **Internal Workspace APIs (service-to-service):** `/internal`

Ví dụ endpoint đầy đủ:
- `GET /api/v1/boards`
- `POST /internal/workspaces/:workspaceId/permissions/check`

---

## 5. Common Headers

### 5.1 External APIs (Gateway → Board Service)

| Header | Required | Type | Description |
|---|---|---|---|
| `x-user-id` | Yes | string | User identifier đã được Gateway xác thực |
| `x-workspace-id` | Yes | string (numeric id) | Workspace context hiện tại |
| `x-role` | Yes | enum(`owner`,`member`,`observer`) | Role của user trong workspace |
| `content-type` | Conditionally | `application/json` | Bắt buộc cho request có body |
| `x-request-id` | No | string | Correlation id cho tracing |

### 5.2 Internal calls (Board Service → Workspace Service)

| Header | Required | Description |
|---|---|---|
| `x-service-name` | Yes | Tên service gọi (`board-service`) |
| `x-request-id` | Recommended | Correlation id |

---

## 6. Common Response Format

### 6.1 Success

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_01J..."
  }
}
```

### 6.2 Error

```json
{
  "success": false,
  "error": {
    "code": "BOARD_NOT_FOUND",
    "message": "Board not found",
    "details": {}
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

---

## 7. Error Codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Sai format dữ liệu/thiếu field bắt buộc |
| 401 | `UNAUTHORIZED` | Thiếu context headers hợp lệ |
| 403 | `FORBIDDEN` | Không đủ quyền thao tác |
| 404 | `BOARD_NOT_FOUND` / `LIST_NOT_FOUND` / `CARD_NOT_FOUND` / `LABEL_NOT_FOUND` / `MEMBER_NOT_FOUND` | Không tìm thấy resource |
| 409 | `DUPLICATE_MEMBER` / `DUPLICATE_LABEL` / `ORDER_CONFLICT` | Xung đột dữ liệu nghiệp vụ |
| 422 | `BUSINESS_RULE_VIOLATION` | Vi phạm rule nghiệp vụ |
| 500 | `INTERNAL_ERROR` | Lỗi hệ thống |
| 502 | `WORKSPACE_SERVICE_ERROR` | Lỗi khi gọi Workspace Service |

---

## 8. Ordering Strategy

- `list.index` và `card.index` là số nguyên (`integer`), dùng để sắp xếp tăng dần.
- Khuyến nghị index liên tiếp (0..n-1) theo board/list.
- API reorder nhận danh sách thứ tự mới và ghi đè index theo vị trí.
- Khi insert vào giữa danh sách, service có thể reindex để tránh trùng `index`.
- Reorder và move phải chạy trong transaction để tránh trạng thái trung gian.

---

## 9. Board APIs

### 9.1 GET `/boards`

- **Description:** Lấy danh sách board trong workspace hiện tại.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** None
- **Query params:**
  - `page` (optional, int, default 1)
  - `limit` (optional, int, default 20, max 100)
  - `search` (optional, string)
  - `type` (optional, enum: `regular`, `template`)
  - `visibility` (optional, enum: `private`, `public`)
- **Request body:** None
- **Validation rules:**
  - `x-workspace-id` bắt buộc, numeric.
  - Chỉ trả board `deletedAt IS NULL`.
- **Business rules:**
  - Chỉ trả dữ liệu theo workspace từ header.
  - Không đọc workspaceId từ URL/body.
- **Internal workspace-service calls:**
  - `GET /internal/workspaces/:workspaceId`
  - `POST /internal/workspaces/:workspaceId/permissions/check` (permission: `board.read`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "publicId": "brd_a1b2c3d4e5f6",
        "name": "Engineering Sprint Board",
        "description": "Sprint planning and execution",
        "slug": "engineering-sprint-board",
        "visibility": "private",
        "type": "regular",
        "workspaceId": 1,
        "createdAt": "2026-05-14T06:00:00.000Z",
        "updatedAt": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  }
}
```

- **Error responses:** 400, 403, 502
- **Transaction notes:** Không cần transaction ghi dữ liệu.

### 9.2 POST `/boards`

- **Description:** Tạo board mới trong workspace hiện tại.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** None
- **Query params:** None
- **Request body:**

```json
{
  "name": "Engineering Sprint Board",
  "description": "Sprint planning and execution",
  "visibility": "private",
  "type": "regular",
  "sourceBoardId": null
}
```

- **Validation rules:**
  - `name`: required, string, max 255, trim, không rỗng.
  - `description`: optional, string.
  - `visibility`: optional enum(`private`,`public`), default `private`.
  - `type`: optional enum(`regular`,`template`), default `regular`.
  - `sourceBoardId`: optional (internal bigint id), chỉ dùng khi clone/template.
- **Business rules:**
  - `workspaceId` lấy từ header, map sang `board.workspaceId` (bigint).
  - Validate workspace tồn tại.
  - Validate user thuộc workspace.
  - Permission yêu cầu: `board.create`.
  - Sinh `publicId` (12 chars) và `slug` từ `name`.
- **Internal workspace-service calls:**
  - `GET /internal/workspaces/:workspaceId`
  - `GET /internal/workspaces/:workspaceId/members/:memberId`
  - `POST /internal/workspaces/:workspaceId/permissions/check` (permission: `board.create`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "publicId": "brd_m8n7b6v5c4x3",
    "name": "Engineering Sprint Board",
    "description": "Sprint planning and execution",
    "slug": "engineering-sprint-board",
    "visibility": "private",
    "type": "regular",
    "workspaceId": 1,
    "sourceBoardId": null,
    "createdAt": "2026-05-14T06:00:00.000Z"
  }
}
```

- **Error responses:** 400, 403, 502
- **Transaction notes:** Single insert, có thể mở transaction nếu kèm clone dữ liệu.

### 9.3 GET `/boards/:boardId`

- **Description:** Lấy thông tin board theo `publicId`.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `boardId` (string, board publicId)
- **Query params:** None
- **Request body:** None
- **Validation rules:**
  - `boardId` required.
  - Board phải thuộc `x-workspace-id`.
  - Board chưa soft-deleted (`deletedAt IS NULL`).
- **Business rules:**
  - Same board validation theo workspace context.
  - Permission: `board.read`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (permission: `board.read`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "publicId": "brd_m8n7b6v5c4x3",
    "name": "Engineering Sprint Board",
    "description": "Sprint planning and execution",
    "slug": "engineering-sprint-board",
    "visibility": "private",
    "type": "regular",
    "workspaceId": 1,
    "createdBy": "7cf457ad-2a6f-488a-9f4f-5f589fcb9e2f",
    "createdAt": "2026-05-14T06:00:00.000Z",
    "updatedAt": null
  }
}
```

- **Error responses:** 403, 404
- **Transaction notes:** None.

### 9.4 PATCH `/boards/:boardId`

- **Description:** Cập nhật board.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `boardId`
- **Query params:** None
- **Request body:**

```json
{
  "name": "Engineering Sprint Board Q2",
  "description": "Updated description",
  "visibility": "public"
}
```

- **Validation rules:**
  - Ít nhất 1 field hợp lệ.
  - `name` max 255, không rỗng sau trim.
  - `visibility` enum(`private`,`public`).
- **Business rules:**
  - Chỉ update board trong cùng workspace.
  - Permission: `board.update`.
  - Cập nhật `updatedAt`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (permission: `board.update`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "publicId": "brd_m8n7b6v5c4x3",
    "name": "Engineering Sprint Board Q2",
    "description": "Updated description",
    "visibility": "public",
    "updatedAt": "2026-05-14T06:30:00.000Z"
  }
}
```

- **Error responses:** 400, 403, 404
- **Transaction notes:** Single update.

### 9.5 DELETE `/boards/:boardId`

- **Description:** Soft delete board.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `boardId`
- **Query params:** None
- **Request body:** None
- **Validation rules:** Board phải tồn tại và thuộc workspace hiện tại.
- **Business rules:**
  - Soft delete board: set `deletedAt`, `deletedBy`.
  - Cascade soft delete lists/cards/labels thuộc board.
  - Permission: `board.delete`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (permission: `board.delete`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "publicId": "brd_m8n7b6v5c4x3",
    "deletedAt": "2026-05-14T07:00:00.000Z"
  }
}
```

- **Error responses:** 403, 404
- **Transaction notes:** Bắt buộc transaction (board + lists + cards + labels).

### 9.6 GET `/boards/:boardId/detail`

- **Description:** Lấy chi tiết board gồm lists, cards, labels, members.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `boardId`
- **Query params:**
  - `includeArchived` (optional, boolean, default false)
- **Request body:** None
- **Validation rules:** `boardId` hợp lệ, board thuộc workspace.
- **Business rules:**
  - Chỉ trả dữ liệu chưa soft-delete nếu `includeArchived=false`.
  - Permission: `board.read`.
- **Internal workspace-service calls:**
  - `GET /internal/workspaces/:workspaceId/members`
  - `POST /internal/workspaces/:workspaceId/permissions/check` (permission: `board.read`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "board": {
      "publicId": "brd_m8n7b6v5c4x3",
      "name": "Engineering Sprint Board Q2"
    },
    "lists": [
      {
        "publicId": "lst_8h7g6f5e4d3c",
        "name": "Todo",
        "index": 0,
        "cards": [
          {
            "publicId": "crd_q1w2e3r4t5y6",
            "title": "Define sprint scope",
            "index": 0,
            "dueDate": null
          }
        ]
      }
    ],
    "labels": [
      {
        "publicId": "lbl_1a2s3d4f5g6h",
        "name": "High Priority",
        "colourCode": "#FF5630"
      }
    ],
    "members": [
      {
        "workspaceMemberId": 101,
        "displayName": "Nguyen Van A"
      }
    ]
  }
}
```

- **Error responses:** 403, 404, 502
- **Transaction notes:** None (read-only).

---

## 10. List APIs

### 10.1 GET `/boards/:boardId/lists`

- **Description:** Lấy lists theo board.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `boardId`
- **Query params:** `includeArchived` (optional boolean, default false)
- **Request body:** None
- **Validation rules:** Board tồn tại, cùng workspace.
- **Business rules:**
  - Trả theo `index ASC`.
  - Permission: `list.read`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`list.read`)
- **Response example:**

```json
{
  "success": true,
  "data": [
    {
      "publicId": "lst_8h7g6f5e4d3c",
      "name": "Todo",
      "index": 0,
      "boardId": "brd_m8n7b6v5c4x3"
    }
  ]
}
```

- **Error responses:** 403, 404
- **Transaction notes:** None.

### 10.2 POST `/boards/:boardId/lists`

- **Description:** Tạo list mới trong board.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `boardId`
- **Query params:** None
- **Request body:**

```json
{
  "name": "In Progress",
  "index": 1
}
```

- **Validation rules:**
  - `name` required, max 255.
  - `index` optional int >= 0; nếu thiếu thì append cuối.
- **Business rules:**
  - Board phải thuộc workspace hiện tại.
  - Permission: `list.create`.
  - Nếu `index` nằm giữa danh sách thì reindex các list phía sau.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`list.create`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "publicId": "lst_m1n2b3v4c5x6",
    "name": "In Progress",
    "index": 1,
    "boardId": "brd_m8n7b6v5c4x3",
    "createdAt": "2026-05-14T07:15:00.000Z"
  }
}
```

- **Error responses:** 400, 403, 404
- **Transaction notes:** Transaction nếu cần reindex.

### 10.3 PATCH `/lists/:listId`

- **Description:** Cập nhật list (đổi tên, index).
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `listId`
- **Query params:** None
- **Request body:**

```json
{
  "name": "Ready For QA"
}
```

- **Validation rules:**
  - `name` optional max 255.
  - `index` optional int >= 0.
- **Business rules:**
  - List phải thuộc board trong workspace header.
  - Permission: `list.update`.
  - Update `updatedAt`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`list.update`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "publicId": "lst_m1n2b3v4c5x6",
    "name": "Ready For QA",
    "index": 1,
    "updatedAt": "2026-05-14T07:20:00.000Z"
  }
}
```

- **Error responses:** 400, 403, 404
- **Transaction notes:** Transaction nếu đổi `index` kèm reindex.

### 10.4 DELETE `/lists/:listId`

- **Description:** Soft delete list.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `listId`
- **Query params:** None
- **Request body:** None
- **Validation rules:** List tồn tại và thuộc workspace.
- **Business rules:**
  - Soft delete list (`deletedAt`, `deletedBy`).
  - Cascade soft delete cards thuộc list.
  - Permission: `list.delete`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`list.delete`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "publicId": "lst_m1n2b3v4c5x6",
    "deletedAt": "2026-05-14T07:25:00.000Z"
  }
}
```

- **Error responses:** 403, 404
- **Transaction notes:** Bắt buộc transaction (list + cards).

### 10.5 PATCH `/boards/:boardId/lists/reorder`

- **Description:** Reorder toàn bộ lists trong board.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `boardId`
- **Query params:** None
- **Request body:**

```json
{
  "items": [
    { "listId": "lst_8h7g6f5e4d3c", "index": 0 },
    { "listId": "lst_m1n2b3v4c5x6", "index": 1 }
  ]
}
```

- **Validation rules:**
  - `items` required, non-empty.
  - Không trùng `listId`, không trùng `index`.
  - Tất cả list phải thuộc cùng `boardId`.
- **Business rules:**
  - Permission: `list.reorder`.
  - Atomic reorder để tránh xung đột.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`list.reorder`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "boardId": "brd_m8n7b6v5c4x3",
    "reordered": 2
  }
}
```

- **Error responses:** 400, 403, 404, 409
- **Transaction notes:** Bắt buộc transaction.

---

## 11. Card APIs

### 11.1 GET `/lists/:listId/cards`

- **Description:** Lấy cards theo list.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `listId`
- **Query params:** `includeArchived` (optional boolean, default false)
- **Request body:** None
- **Validation rules:** List hợp lệ và thuộc workspace.
- **Business rules:**
  - Trả theo `index ASC`.
  - Permission: `card.read`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.read`)
- **Response example:**

```json
{
  "success": true,
  "data": [
    {
      "publicId": "crd_q1w2e3r4t5y6",
      "title": "Define sprint scope",
      "description": null,
      "index": 0,
      "listId": "lst_8h7g6f5e4d3c",
      "dueDate": null
    }
  ]
}
```

- **Error responses:** 403, 404
- **Transaction notes:** None.

### 11.2 POST `/lists/:listId/cards`

- **Description:** Tạo card trong list.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `listId`
- **Query params:** None
- **Request body:**

```json
{
  "title": "Prepare sprint backlog",
  "description": "Collect candidate tasks",
  "index": 1,
  "dueDate": "2026-05-20T10:00:00.000Z"
}
```

- **Validation rules:**
  - `title` required, không rỗng.
  - `description` optional.
  - `index` optional int >= 0.
  - `dueDate` optional ISO timestamp.
- **Business rules:**
  - List phải cùng workspace.
  - Permission: `card.create`.
  - Nếu có dueDate quá khứ => reject (422).
  - Log activity `card.created`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.create`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "publicId": "crd_z1x2c3v4b5n6",
    "title": "Prepare sprint backlog",
    "description": "Collect candidate tasks",
    "index": 1,
    "listId": "lst_8h7g6f5e4d3c",
    "dueDate": "2026-05-20T10:00:00.000Z",
    "createdAt": "2026-05-14T07:40:00.000Z"
  }
}
```

- **Error responses:** 400, 403, 404, 422
- **Transaction notes:** Transaction nếu cần reindex + activity insert.

### 11.3 GET `/cards/:cardId`

- **Description:** Lấy chi tiết card.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `cardId`
- **Query params:** None
- **Request body:** None
- **Validation rules:** Card tồn tại, chưa soft-delete.
- **Business rules:**
  - Same board validation: card phải thuộc board trong workspace.
  - Permission: `card.read`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.read`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "publicId": "crd_z1x2c3v4b5n6",
    "title": "Prepare sprint backlog",
    "description": "Collect candidate tasks",
    "index": 1,
    "dueDate": "2026-05-20T10:00:00.000Z",
    "listId": "lst_8h7g6f5e4d3c",
    "labels": [],
    "members": []
  }
}
```

- **Error responses:** 403, 404
- **Transaction notes:** None.

### 11.4 PATCH `/cards/:cardId`

- **Description:** Cập nhật card (title, description, index, dueDate).
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `cardId`
- **Query params:** None
- **Request body:**

```json
{
  "title": "Prepare sprint backlog v2",
  "description": "Updated details",
  "index": 2,
  "dueDate": "2026-05-21T10:00:00.000Z"
}
```

- **Validation rules:**
  - Ít nhất 1 field hợp lệ.
  - `dueDate` nếu có phải ISO timestamp.
- **Business rules:**
  - Permission: `card.update`.
  - Ghi activity theo field thay đổi:
    - `card.updated.title`
    - `card.updated.description`
    - `card.updated.index`
    - `card.updated.dueDate.added|updated|removed`
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.update`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "publicId": "crd_z1x2c3v4b5n6",
    "title": "Prepare sprint backlog v2",
    "description": "Updated details",
    "index": 2,
    "dueDate": "2026-05-21T10:00:00.000Z",
    "updatedAt": "2026-05-14T07:50:00.000Z"
  }
}
```

- **Error responses:** 400, 403, 404, 422
- **Transaction notes:** Transaction khi update + activity insert.

### 11.5 DELETE `/cards/:cardId`

- **Description:** Soft delete card.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `cardId`
- **Query params:** None
- **Request body:** None
- **Validation rules:** Card tồn tại và thuộc workspace.
- **Business rules:**
  - Set `deletedAt`, `deletedBy`.
  - Permission: `card.delete`.
  - Ghi activity `card.archived`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.delete`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "publicId": "crd_z1x2c3v4b5n6",
    "deletedAt": "2026-05-14T08:00:00.000Z"
  }
}
```

- **Error responses:** 403, 404
- **Transaction notes:** Transaction cho card + activity.

### 11.6 PATCH `/cards/:cardId/move`

- **Description:** Move card sang list khác hoặc đổi vị trí trong list.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `cardId`
- **Query params:** None
- **Request body:**

```json
{
  "toListId": "lst_m1n2b3v4c5x6",
  "toIndex": 0
}
```

- **Validation rules:**
  - `toListId` required.
  - `toIndex` required int >= 0.
- **Business rules:**
  - Source list và destination list phải cùng board (same board validation).
  - Permission: `card.move`.
  - Reindex source list và destination list.
  - Log `card.updated.list` và/hoặc `card.updated.index`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.move`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "cardId": "crd_z1x2c3v4b5n6",
    "fromListId": "lst_8h7g6f5e4d3c",
    "toListId": "lst_m1n2b3v4c5x6",
    "fromIndex": 2,
    "toIndex": 0
  }
}
```

- **Error responses:** 400, 403, 404, 409
- **Transaction notes:** Bắt buộc transaction (card update + reindex + activity).

### 11.7 PATCH `/lists/:listId/cards/reorder`

- **Description:** Reorder cards trong một list.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `listId`
- **Query params:** None
- **Request body:**

```json
{
  "items": [
    { "cardId": "crd_q1w2e3r4t5y6", "index": 0 },
    { "cardId": "crd_z1x2c3v4b5n6", "index": 1 }
  ]
}
```

- **Validation rules:**
  - `items` required, non-empty.
  - Không trùng `cardId` và `index`.
  - Tất cả card thuộc `listId`.
- **Business rules:**
  - Permission: `card.reorder`.
  - Atomic reorder.
  - Log `card.updated.index` cho card bị ảnh hưởng.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.reorder`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "listId": "lst_8h7g6f5e4d3c",
    "reordered": 2
  }
}
```

- **Error responses:** 400, 403, 404, 409
- **Transaction notes:** Bắt buộc transaction.

---

## 12. Label APIs

### 12.1 GET `/boards/:boardId/labels`

- **Description:** Lấy labels của board.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `boardId`
- **Query params:** None
- **Request body:** None
- **Validation rules:** Board hợp lệ, cùng workspace.
- **Business rules:** Permission `label.read`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`label.read`)
- **Response example:**

```json
{
  "success": true,
  "data": [
    {
      "publicId": "lbl_1a2s3d4f5g6h",
      "name": "High Priority",
      "colourCode": "#FF5630",
      "boardId": "brd_m8n7b6v5c4x3"
    }
  ]
}
```

- **Error responses:** 403, 404
- **Transaction notes:** None.

### 12.2 POST `/boards/:boardId/labels`

- **Description:** Tạo label mới trong board.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `boardId`
- **Query params:** None
- **Request body:**

```json
{
  "name": "High Priority",
  "colourCode": "#FF5630"
}
```

- **Validation rules:**
  - `name` required, max 255.
  - `colourCode` optional, max 12.
- **Business rules:**
  - Permission: `label.create`.
  - Label thuộc board hiện tại.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`label.create`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "publicId": "lbl_9i8u7y6t5r4e",
    "name": "High Priority",
    "colourCode": "#FF5630",
    "boardId": "brd_m8n7b6v5c4x3"
  }
}
```

- **Error responses:** 400, 403, 404
- **Transaction notes:** Single insert.

### 12.3 POST `/cards/:cardId/labels`

- **Description:** Gắn label vào card.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `cardId`
- **Query params:** None
- **Request body:**

```json
{
  "labelId": "lbl_9i8u7y6t5r4e"
}
```

- **Validation rules:** `labelId` required.
- **Business rules:**
  - Card và label phải thuộc cùng board (same board validation).
  - Không cho gắn trùng label (duplicate label validation).
  - Permission: `card.update`.
  - Log `card.updated.label.added`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.update`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "cardId": "crd_z1x2c3v4b5n6",
    "labelId": "lbl_9i8u7y6t5r4e"
  }
}
```

- **Error responses:** 400, 403, 404, 409
- **Transaction notes:** Transaction cho relation insert + activity.

### 12.4 DELETE `/cards/:cardId/labels/:labelId`

- **Description:** Gỡ label khỏi card.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `cardId`, `labelId`
- **Query params:** None
- **Request body:** None
- **Validation rules:** mapping card-label phải tồn tại.
- **Business rules:**
  - Card và label phải cùng board.
  - Permission: `card.update`.
  - Log `card.updated.label.removed`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.update`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "cardId": "crd_z1x2c3v4b5n6",
    "labelId": "lbl_9i8u7y6t5r4e",
    "removed": true
  }
}
```

- **Error responses:** 403, 404
- **Transaction notes:** Transaction cho relation delete + activity.

---

## 13. Card Member APIs

### 13.1 GET `/boards/:boardId/members`

- **Description:** Lấy danh sách workspace members để gán card trong board.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `boardId`
- **Query params:** `keyword` (optional string)
- **Request body:** None
- **Validation rules:** board hợp lệ, cùng workspace.
- **Business rules:** Permission `card.read`.
- **Internal workspace-service calls:**
  - `GET /internal/workspaces/:workspaceId/members`
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.read`)
- **Response example:**

```json
{
  "success": true,
  "data": [
    {
      "workspaceMemberId": 101,
      "userId": "user_1",
      "displayName": "Nguyen Van A",
      "role": "member"
    }
  ]
}
```

- **Error responses:** 403, 404, 502
- **Transaction notes:** None.

### 13.2 POST `/cards/:cardId/members`

- **Description:** Gán member vào card.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `cardId`
- **Query params:** None
- **Request body:**

```json
{
  "memberId": 101
}
```

- **Validation rules:** `memberId` required (workspaceMemberId bigint).
- **Business rules:**
  - Validate member thuộc workspace.
  - Không cho gán trùng member (duplicate member validation).
  - Permission: `card.update`.
  - Log `card.updated.member.added`.
- **Internal workspace-service calls:**
  - `GET /internal/workspaces/:workspaceId/members/:memberId`
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.update`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "cardId": "crd_z1x2c3v4b5n6",
    "workspaceMemberId": 101
  }
}
```

- **Error responses:** 400, 403, 404, 409
- **Transaction notes:** Transaction cho relation insert + activity.

### 13.3 DELETE `/cards/:cardId/members/:memberId`

- **Description:** Gỡ member khỏi card.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `cardId`, `memberId`
- **Query params:** None
- **Request body:** None
- **Validation rules:** mapping card-member phải tồn tại.
- **Business rules:**
  - Permission: `card.update`.
  - Log `card.updated.member.removed`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.update`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "cardId": "crd_z1x2c3v4b5n6",
    "workspaceMemberId": 101,
    "removed": true
  }
}
```

- **Error responses:** 403, 404
- **Transaction notes:** Transaction cho relation delete + activity.

---

## 14. Due Date APIs

### 14.1 PATCH `/cards/:cardId/due-date`

- **Description:** Thêm/cập nhật due date cho card.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `cardId`
- **Query params:** None
- **Request body:**

```json
{
  "dueDate": "2026-05-25T12:00:00.000Z"
}
```

- **Validation rules:**
  - `dueDate` required, ISO timestamp.
- **Business rules:**
  - Permission: `card.update`.
  - Nếu card chưa có dueDate => `card.updated.dueDate.added`.
  - Nếu đã có dueDate => `card.updated.dueDate.updated`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.update`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "cardId": "crd_z1x2c3v4b5n6",
    "dueDate": "2026-05-25T12:00:00.000Z"
  }
}
```

- **Error responses:** 400, 403, 404, 422
- **Transaction notes:** Transaction cho card update + activity.

### 14.2 DELETE `/cards/:cardId/due-date`

- **Description:** Xóa due date khỏi card.
- **Headers:** `x-user-id`, `x-workspace-id`, `x-role`
- **Path params:** `cardId`
- **Query params:** None
- **Request body:** None
- **Validation rules:** Card phải tồn tại.
- **Business rules:**
  - Permission: `card.update`.
  - Set `dueDate = null`.
  - Log `card.updated.dueDate.removed`.
- **Internal workspace-service calls:**
  - `POST /internal/workspaces/:workspaceId/permissions/check` (`card.update`)
- **Response example:**

```json
{
  "success": true,
  "data": {
    "cardId": "crd_z1x2c3v4b5n6",
    "dueDate": null
  }
}
```

- **Error responses:** 403, 404
- **Transaction notes:** Transaction cho card update + activity.

---

## 15. Internal Workspace Service APIs

Board Service gọi các APIs sau:

### 15.1 GET `/internal/workspaces/:workspaceId`
- Mục đích: validate workspace exists.
- Dùng trong: hầu hết APIs đọc/ghi board/list/card.

### 15.2 GET `/internal/workspaces/:workspaceId/members/:memberId`
- Mục đích: validate member thuộc workspace.
- Dùng trong: `POST /cards/:cardId/members`.

### 15.3 GET `/internal/workspaces/:workspaceId/members`
- Mục đích: lấy workspace members cho UI/assignment.
- Dùng trong: `GET /boards/:boardId/members`, `GET /boards/:boardId/detail`.

### 15.4 POST `/internal/workspaces/:workspaceId/permissions/check`
- Mục đích: validate permission cho action cụ thể.
- Request body mẫu:

```json
{
  "userId": "user_1",
  "resource": "board",
  "action": "update"
}
```

- Response mẫu:

```json
{
  "allowed": true
}
```

Nếu timeout/lỗi từ Workspace Service, Board Service trả `502 WORKSPACE_SERVICE_ERROR`.

---

## 16. Transaction Requirements

Bắt buộc dùng DB transaction cho các luồng:
1. Delete board (soft delete board + lists + cards + labels).
2. Delete list (soft delete list + cards).
3. Move card (update card + reindex nguồn/đích + activity).
4. Reorder lists/cards (batch update index).
5. Add/remove member/label khi có activity logging cùng lúc.
6. Update due date với activity logging.

Nguyên tắc:
- Atomic commit/rollback.
- Không để trạng thái index trung gian.
- Ghi activity cùng transaction để đảm bảo tính nhất quán nghiệp vụ.

---

## 17. Activity Logging Rules

Sử dụng bảng `card_activity` và enum `activityType`.

Các loại chính cần log:
- `card.created`
- `card.updated.title`
- `card.updated.description`
- `card.updated.index`
- `card.updated.list`
- `card.updated.label.added`
- `card.updated.label.removed`
- `card.updated.member.added`
- `card.updated.member.removed`
- `card.updated.dueDate.added`
- `card.updated.dueDate.updated`
- `card.updated.dueDate.removed`
- `card.archived`

Mapping field trong `card_activity`:
- Đổi vị trí/list: `fromIndex`, `toIndex`, `fromListId`, `toListId`
- Đổi title/description: `fromTitle`, `toTitle`, `fromDescription`, `toDescription`
- Đổi due date: `fromDueDate`, `toDueDate`
- Thao tác label/member: `labelId`, `workspaceMemberId`
- Người thao tác: `createdBy`

---

## 18. Soft Delete Rules

Áp dụng cho `board`, `list`, `card`, `label`:
- Không xóa cứng trong luồng nghiệp vụ chuẩn.
- Set `deletedAt` (timestamp) và `deletedBy` (uuid) khi delete.
- Query mặc định chỉ lấy bản ghi `deletedAt IS NULL`.

Cascade rules:
1. Soft delete board → soft delete toàn bộ lists/cards/labels thuộc board.
2. Soft delete list → soft delete toàn bộ cards thuộc list.
3. Card-label/card-member relation có thể hard delete mapping row.

---

## 19. Business Validation Rules

1. **Workspace validation**
   - Mọi external API phải dùng `x-workspace-id` từ header.
   - Không nhận workspace context qua URL path/body cho external APIs.

2. **Same board validation**
   - Các thao tác cross-resource (move card, attach label/member) phải đảm bảo các thực thể thuộc cùng board/workspace.

3. **Member validation**
   - `workspaceMemberId` phải tồn tại và thuộc workspace.
   - Không cho assign duplicate member vào cùng card (`_card_workspace_members`).

4. **Label validation**
   - Không cho attach duplicate label vào cùng card (`_card_labels`).

5. **Ordering/index validation**
   - `index` là số nguyên không âm.
   - Không chấp nhận payload reorder có index trùng hoặc thiếu phần tử bắt buộc.
   - Sau reorder/move, index phải nhất quán.

6. **Soft delete enforcement**
   - Resource đã soft-delete coi như không tồn tại cho API đọc/ghi (`404`).

7. **Due date validation**
   - Format ISO timestamp.
   - Không cho due date không hợp lệ; có thể chặn due date quá khứ theo policy sản phẩm.

8. **Permission validation**
   - Board Service phải gọi Workspace Service permission check trước thao tác ghi.

9. **Activity logging validation**
   - Mọi thay đổi quan trọng trên card phải ghi `card_activity` tương ứng.

10. **Cascade consistency**
   - Delete board/list phải đảm bảo cascade đúng phạm vi dữ liệu trong transaction.
