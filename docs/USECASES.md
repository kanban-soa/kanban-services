# TÀI LIỆU USE CASE — HỆ THỐNG KANBAN (MICROSERVICES)

> Tài liệu mô tả toàn bộ use case của hệ thống Kanban SOA gồm 6 service:
> `api-gateway`, `auth-service`, `workspace-service`, `board-service`,
> `noti-service`, `activity-service`, `statistic-service`.
> Mục tiêu: cung cấp cái nhìn tổng quan về chức năng nghiệp vụ, actor, luồng
> chính / luồng phụ, và sự tương tác giữa các service.

---

## 1. TỔNG QUAN KIẾN TRÚC

```
┌──────────────┐     HTTPS      ┌─────────────────┐
│   Frontend   │ ─────────────► │   API Gateway   │ :9000
└──────────────┘                └────────┬────────┘
                                         │  (JWT verify, rate-limit,
                                         │   inject x-user-* headers)
        ┌────────────┬─────────────┬─────┴─────┬───────────────┬──────────────┐
        ▼            ▼             ▼           ▼               ▼              ▼
   Auth-Service Workspace-svc  Board-svc   Noti-svc      Activity-svc  Statistic-svc
      :9001        :9005         :9003       :9004           :9010         :9002
        │            │             │           ▲               ▲              ▲
        │            │             │           │               │              │
        │            ▼             ▼           │               │              │
        │      (internal API)  workspace-svc   │               │              │
        │                      (kiểm tra       │               │              │
        │                       membership)    │               │              │
        │                          │           │               │              │
        │                          └───────────┴───────────────┘              │
        │                            board-svc phát event                     │
        │                                                                     │
        └─────────────────────────────────────────────────────────────────────┘
                  (auth-svc cấp / xác minh JWT cho mọi service)
```

**Đặc điểm chung**
- Mỗi entity có `id` (numeric, internal) và `publicId` (string, public-facing).
  API client luôn dùng `publicId`, các call internal giữa service có thể dùng
  numeric id để tối ưu.
- Tất cả service có `softDelete` (cột `deletedAt`).
- Gateway tin cậy `x-user-*` header sau khi đã verify JWT; các service downstream
  không tự xác thực lại JWT mà tin tưởng header gateway truyền vào.

---

## 2. DANH SÁCH ACTOR

| Mã | Tên Actor | Mô tả |
|----|-----------|-------|
| A1 | Guest (Khách) | Chưa đăng nhập. Đăng ký, đăng nhập, reset mật khẩu. |
| A2 | Authenticated User | Người dùng đã đăng nhập (có JWT). Quản lý hồ sơ, workspace, nhận thông báo. |
| A3 | Workspace Admin / Owner | Người tạo workspace hoặc được gán role admin. Toàn quyền trong workspace đó. |
| A4 | Workspace Member | Thành viên đã accept lời mời. Tạo board, thao tác task. |
| A5 | Workspace Observer | Chỉ đọc workspace, board, card. |
| A6 | Invitee | Người được mời nhưng chưa accept. Xem được lời mời, accept hoặc từ chối. |
| A7 | System (cron / background) | Cleanup phiên hết hạn, OTP hết hạn, retention activity. |
| A8 | Internal Service | Gọi qua endpoint `/internal/*`, không cần JWT. |

---

## 3. USE CASE THEO NHÓM CHỨC NĂNG

Mỗi use case có dạng:
- **ID**: định danh ngắn.
- **Tên**, **Actor**, **Tiền điều kiện**, **Luồng chính**, **Luồng phụ / ngoại lệ**,
  **Hậu điều kiện**, **Service & Endpoint** liên quan.

### 3.1. NHÓM XÁC THỰC & TÀI KHOẢN (auth-service)

#### UC-AUTH-01. Đăng ký tài khoản
- **Actor**: A1 Guest
- **Tiền điều kiện**: Email chưa tồn tại trong hệ thống.
- **Luồng chính**:
  1. Guest gửi `POST /api/v1/auth/users` với `{ email, password, name }`.
  2. Auth-service hash mật khẩu (bcrypt), tạo record `users`.
  3. Auto tạo phiên đầu tiên (`session`), trả JWT + refresh token.
- **Luồng phụ**: Email đã tồn tại → 409 Conflict.
- **Hậu điều kiện**: User có thể đăng nhập ngay; token đã trả về cho client.

#### UC-AUTH-02. Đăng nhập
- **Actor**: A1 Guest
- **Luồng chính**:
  1. Gửi `POST /api/v1/auth/users/login` `{ email, password }`.
  2. Service so khớp hash, tạo `session` mới, trả JWT + refresh.
- **Luồng phụ**: Sai mật khẩu → 401; tài khoản bị xóa → 404.

#### UC-AUTH-03. Quên / đặt lại mật khẩu
- **Actor**: A1 Guest
- **Luồng chính**:
  1. `POST /users/forgot-password { email }` → tạo OTP 6 ký tự (table `verification`,
     hạn 15 phút), gửi email qua SMTP.
  2. User nhập OTP + mật khẩu mới: `POST /users/reset-password`.
  3. Service verify OTP, hash mật khẩu mới, xoá tất cả `session` cũ.
- **Luồng phụ**: OTP hết hạn / sai → 400.
- **Hậu điều kiện**: Mọi phiên đăng nhập trước đó bị vô hiệu hoá.

#### UC-AUTH-04. Làm mới access token
- **Actor**: A2 Authenticated User
- **Luồng**: `POST /api/v1/auth/sessions/refresh` với refresh token → trả JWT mới.

#### UC-AUTH-05. Đăng xuất / Đăng xuất tất cả thiết bị
- **Actor**: A2
- **Luồng**:
  - `POST /sessions/logout` → xóa session hiện tại.
  - `DELETE /sessions/user/:userId` → xóa tất cả session của user (đăng xuất khắp mọi thiết bị).

#### UC-AUTH-06. Liên kết / huỷ liên kết OAuth (Google, GitHub…)
- **Actor**: A2
- **Luồng**:
  - `POST /sessions/accounts` → lưu provider, accessToken, refreshToken vào bảng `account`.
  - `DELETE /sessions/accounts/:userId/:providerId` → huỷ liên kết.
  - `GET /sessions/accounts/:userId` → liệt kê provider đã liên kết.

#### UC-AUTH-07. Xem / cập nhật / xoá hồ sơ
- **Actor**: A2 (chính chủ)
- **Endpoint**:
  - `GET /users/:id`, `GET /users?ids=…`, `GET /users?email=…`
  - `PUT /users/:id` — cập nhật name, avatar.
  - `DELETE /users/:id` — xóa tài khoản.

#### UC-AUTH-08. Xác minh JWT (internal)
- **Actor**: A8 Internal Service (gateway, các service khác)
- **Luồng**: `POST /api/v1/auth/sessions/verify-jwt` → trả về payload `{ id, email, name, role }`.
- **Sử dụng bởi**: API gateway middleware auth.

#### UC-AUTH-09. Mã xác minh (2FA / email verification)
- **Actor**: A2
- **Luồng**:
  - `POST /sessions/verifications` → tạo OTP cho identifier (email/sđt).
  - `POST /sessions/verifications/verify` → check OTP, xoá record sau khi verify.

---

### 3.2. NHÓM WORKSPACE (workspace-service)

#### UC-WS-01. Tạo workspace
- **Actor**: A2 Authenticated User
- **Luồng chính**:
  1. `POST /api/v1/workspaces { name, slug?, description? }`.
  2. Sinh `publicId` (12 ký tự), slug duy nhất (auto suffix nếu trùng).
  3. Tạo record `workspace`, plan mặc định `free`.
  4. Auto thêm creator vào `workspace_members` với role `Admin`.
  5. Tạo role mặc định `Admin` (`isSystem=true`) cho workspace.
- **Hậu điều kiện**: Creator trở thành A3 (Admin/Owner) của workspace.

#### UC-WS-02. Liệt kê workspace của tôi
- **Actor**: A2
- **Endpoint**: `GET /api/v1/workspaces`
- **Logic**: Lấy mọi workspace user là thành viên, kèm count members.

#### UC-WS-03. Xem chi tiết workspace
- **Actor**: A4 Member (hoặc trở lên)
- **Endpoint**: `GET /api/v1/workspaces/:publicId`
- **Luồng phụ**: Không phải member → 403 Forbidden.

#### UC-WS-04. Cập nhật workspace
- **Actor**: A3 Admin
- **Endpoint**: `PATCH /api/v1/workspaces/:publicId { name?, slug?, description? }`
- **Luồng phụ**: Không phải admin → 403; slug trùng → 400.

#### UC-WS-05. Xóa workspace
- **Actor**: A3 Admin
- **Endpoint**: `DELETE /api/v1/workspaces/:publicId`
- **Luồng chính**:
  1. Resolve publicId → workspace.
  2. Verify caller là admin.
  3. Soft delete workspace (`deletedAt`, `deletedBy`).
  4. Cascade: gọi board-service xoá mọi board của workspace
     (non-critical — nếu board-service down vẫn trả 204, log warning).
- **Hậu điều kiện**: Workspace + boards bị soft-delete; thành viên không truy cập được nữa.

#### UC-WS-06. Quản lý thành viên — mời
- **Actor**: A3 Admin
- **Endpoint**: `POST /api/v1/workspaces/:publicId/members { email, roleId? }`
- **Luồng**:
  1. Auth-service xác minh email có tài khoản.
  2. Tạo record `workspace_members` status = `invited`.
  3. Gửi event `member.invited` sang noti-service.
- **Luồng phụ**: Email chưa đăng ký → gửi lời mời pending; member đã tồn tại → 409.

#### UC-WS-07. Xem lời mời (admin / user)
- **Admin xem lời mời còn pending**: `GET /workspaces/:id/members/invitation`.
- **User xem lời mời gửi tới mình**: `GET /api/v1/workspaces/invitations`.

#### UC-WS-08. Hủy lời mời
- **Actor**: A3 Admin
- **Endpoint**: `DELETE /workspaces/:id/members/invitation/:invitationId`.

#### UC-WS-09. Liệt kê & xem thành viên
- **Endpoint**:
  - `GET /workspaces/:id/members` (phân trang)
  - `GET /workspaces/:id/members/:memberId`
  - `POST /workspaces/:id/members/summary` — bulk lookup compact (id + email).

#### UC-WS-10. Đổi role thành viên
- **Actor**: A3 Admin
- **Endpoint**: `PATCH /workspaces/:id/members/:memberId { roleId }`
- **Side effect**: notification `member.role_changed`.

#### UC-WS-11. Xoá thành viên khỏi workspace
- **Actor**: A3 Admin
- **Endpoint**: `DELETE /workspaces/:id/members/:memberId`
- **Side effect**: notification `member.removed`.

#### UC-WS-12. Quản lý role & permission
- **Actor**: A3 Admin
- **Endpoints**:
  - `GET /workspaces/:id/roles` — danh sách role.
  - `POST /workspaces/:id/roles` — tạo role custom.
  - `GET /workspaces/:id/roles/:roleId/permissions` — quyền của role.
  - `POST /workspaces/:id/roles/:roleId/permissions` — cấp quyền cho role.
- **Permission string**: `workspace.read`, `workspace.update`, `member.invite`,
  `board.create`, `board.delete`, `permission.manage`, …

#### UC-WS-13. Kiểm tra / lấy quyền của user
- **Endpoint**:
  - `GET /workspaces/:id/permissions` — quyền user hiện tại.
  - `POST /workspaces/:id/permissions` — check permission cụ thể.

#### UC-WS-14. Internal: xác minh quyền (cho board-service)
- **Actor**: A8 Internal
- **Endpoints**:
  - `GET /internal/workspaces/:workspaceId/members/:userId/authorization`
    → `{ isAdmin, isOwner }`.
  - `GET /internal/workspaces/:id/members/:userId` → profile member.
  - `GET /internal/workspaces/by-public-id/:publicId` → resolve publicId → numeric id.

---

### 3.3. NHÓM BOARD / LIST / CARD (board-service)

> Mọi route đều phải qua workspace-service để kiểm tra membership trước khi thao tác.

#### UC-BRD-01. Tạo board
- **Actor**: A4 Member
- **Endpoint**: `POST /api/v1/workspaces/:workspaceId/boards { name, description?, visibility }`
- **Luồng**:
  1. Resolve workspace (publicId hoặc numeric).
  2. Verify caller là member của workspace.
  3. Tạo board, sinh `publicId`, slug duy nhất trong workspace.
  4. Phát event `board.created` → activity-service.

#### UC-BRD-02. Liệt kê / xem board
- **Endpoints**:
  - `GET /workspaces/:workspaceId/boards` — list board.
  - `GET /workspaces/:workspaceId/boards/:boardId` — chi tiết board (kèm lists).

#### UC-BRD-03. Cập nhật board
- **Endpoint**: `PATCH /workspaces/:workspaceId/boards/:boardId`
- **Có thể đổi**: name, description, visibility (public/private), type.
- **Side effect**: emit `board.updated` → activity-service.

#### UC-BRD-04. Xoá board
- **Endpoint**: `DELETE /workspaces/:workspaceId/boards/:boardId`
- **Luồng**: Soft-delete, cascade hidden cho lists/cards bên dưới; emit `board.deleted`.

#### UC-BRD-05. Quản lý List
- **Tạo**: `POST /:boardId/lists { name }` — index tự tăng.
- **Cập nhật tên**: `PATCH /lists/:listId`.
- **Xoá**: `DELETE /lists/:listId` — cascade xoá cards.

#### UC-BRD-06. Quản lý Card (CRUD)
- **Tạo**: `POST /lists/:listId/cards { title, description? }`.
- **Liệt kê theo list**: `GET /lists/:listId/cards`.
- **Chi tiết**: `GET /cards/:cardId` (kèm labels, members).
- **Cập nhật**: `PATCH /cards/:cardId { title?, description? }`.
- **Xoá**: `DELETE /cards/:cardId`.
- **Side effect**: mỗi hành động ghi `card_activity` (local log) — phục vụ
  audit và statistic.

#### UC-BRD-07. Di chuyển card / sắp lại thứ tự
- **Endpoint**: `PATCH /cards/:cardId { listId, index }`
- **Logic**: Cập nhật `listId` và `index`; ghi log
  `card.updated.list` (`fromListId → toListId`).

#### UC-BRD-08. Đặt / xoá thời hạn (due date)
- **Endpoints**:
  - `PATCH /cards/:cardId/due-date { dueDate }`
  - `DELETE /cards/:cardId/due-date`

#### UC-BRD-09. Gắn / bỏ label
- **Endpoints**:
  - `POST /cards/:cardId/labels/:labelId`
  - `DELETE /cards/:cardId/labels/:labelId`
- **Labels** tạo/sửa/xoá ở scope board:
  - `GET /:boardId/labels`, `PATCH /:boardId/labels/:labelId`,
    `DELETE /:boardId/labels/:labelId`.

#### UC-BRD-10. Assign / bỏ assign member trên card
- **Endpoints**:
  - `POST /cards/:cardId/members { workspaceMemberId }`
  - `DELETE /cards/:cardId/members/:memberId`
- **Side effect**: notification `card.member_assigned` → noti-service.

#### UC-BRD-11. Lấy tất cả boards (bulk)
- **Endpoint**: `POST /all { workspaceIds: [] }` — dùng cho dashboard.

---

### 3.4. NHÓM THÔNG BÁO (noti-service)

#### UC-NOTI-01. Tạo thông báo
- **Actor**: A8 Internal (workspace-service, board-service)
- **Endpoint**: `POST /api/notifications { type, userId, cardId?, workspaceId?, metadata }`
- **Type**: `member.invited`, `member.role_changed`, `member.removed`,
  `workspace.deleted`, `card.member_assigned`, `card.comment`, …

#### UC-NOTI-02. Xem thông báo của tôi
- **Actor**: A2
- **Endpoint**: `GET /api/notifications?unread=true` — phân trang.

#### UC-NOTI-03. Đếm chưa đọc (badge)
- **Endpoint**: `GET /api/notifications/unread-count`.

#### UC-NOTI-04. Đánh dấu đã đọc
- **Endpoints**:
  - `PATCH /api/notifications/:publicId/read` — đánh dấu một thông báo.
  - `PATCH /api/notifications/read-all` — đánh dấu tất cả.

#### UC-NOTI-05. Xoá thông báo
- **Endpoint**: `DELETE /api/notifications/:publicId` (soft delete).

---

### 3.5. NHÓM AUDIT LOG (activity-service)

#### UC-ACT-01. Ghi nhật ký hoạt động
- **Actor**: A8 Internal (board-service)
- **Endpoint**: `POST /internal/activities { workspaceId, actorUserId, actionType, entityType, entityId, metadata }`
- **actionType**: `board.created | board.deleted | card.created | card.deleted | card.updated`.

#### UC-ACT-02. Xem hoạt động workspace
- **Actor**: A3 Admin / A4 Member
- **Endpoint**: `GET /api/activities/workspaces/:workspaceId`
- **Filter**: `actionType`, `entityType`, `userId`, khoảng ngày, phân trang.
- **Phân quyền**: workspace-service kiểm tra caller là member.

#### UC-ACT-03. Retention tự động
- **Actor**: A7 System
- **Logic**: Cron xoá record cũ hơn `RETENTION_DAYS` (cấu hình env).

---

### 3.6. NHÓM THỐNG KÊ (statistic-service)

> Service này tổng hợp dữ liệu từ board-service + activity-service, không có
> bảng riêng cho metric.

#### UC-STAT-01. Dashboard tổng quan workspace
- **Actor**: A3 / A4
- **Endpoint**: `GET /api/statistics/:workspaceId`
- **Trả về**:
  - Cards: completed / updated / created (kèm trend so kỳ trước).
  - Phân bổ độ ưu tiên (Urgent / High / Normal).
  - Workload theo member (Overload / High / Optimal / Available).
  - Cards sắp đến hạn (upcoming due).

#### UC-STAT-02. Hiệu suất cá nhân
- **Endpoint**: `GET /api/statistics/:workspaceId/self-performance?range=7d|30d|90d`.

#### UC-STAT-03. Hoạt động gần đây
- **Endpoint**: `GET /api/statistics/:workspaceId/activities` — proxy activity-service.

#### UC-STAT-04. Xuất báo cáo
- **Endpoint**: `GET /api/statistics/:workspaceId/export?format=csv|json`
- **Nội dung**: metrics + activities + priorities + workloads, stream CSV.

---

### 3.7. API GATEWAY (api-gateway)

#### UC-GW-01. Định tuyến request
- Map prefix `/api/v1/*` tới service downstream tương ứng.
- Rewrite path `/api/v1` → `/api` trước khi proxy.

#### UC-GW-02. Xác thực JWT tập trung
- Trích `Authorization: Bearer …`, gọi `auth-service/verify-jwt`.
- Inject `x-user-id`, `x-user-email`, `x-user-name`, `x-user-role`,
  `x-request-id` cho downstream.
- Lọc bỏ các header trên nếu client cố ý gửi (chống spoofing).

#### UC-GW-03. Rate limiting + CORS + Request ID
- Per-route limit (429 nếu vượt).
- Cấu hình CORS từ `CORS_ORIGINS`.
- Mỗi request có request-id phục vụ tracing.

#### UC-GW-04. Health check
- `GET /health` → `{ status: "ok", service: "api-gateway", timestamp }`.

#### UC-GW-05. Tài liệu API
- Phục vụ Swagger/OpenAPI tại `/docs/swagger` (mô tả đầy đủ tag:
  `auth`, `workspaces`, `workspace-members`, `boards`, `lists`, `cards`,
  `labels`, `notifications`, `statistics`, …).

---

## 4. MA TRẬN ACTOR × USE CASE (rút gọn)

| Use case | Guest | User | Member | Admin | Internal |
|----------|:-----:|:----:|:------:|:-----:|:--------:|
| Đăng ký / Đăng nhập | ✅ | – | – | – | – |
| Reset mật khẩu | ✅ | – | – | – | – |
| Cập nhật hồ sơ | – | ✅ | – | – | – |
| Tạo workspace | – | ✅ | – | – | – |
| Xem workspace | – | – | ✅ | ✅ | – |
| Sửa / xoá workspace | – | – | – | ✅ | – |
| Mời / xoá member | – | – | – | ✅ | – |
| Đổi role | – | – | – | ✅ | – |
| Tạo / sửa / xoá board | – | – | ✅ | ✅ | – |
| Tạo / di chuyển card | – | – | ✅ | ✅ | – |
| Xem thông báo của mình | – | ✅ | ✅ | ✅ | – |
| Tạo thông báo | – | – | – | – | ✅ |
| Ghi activity log | – | – | – | – | ✅ |
| Xem activity log workspace | – | – | ✅ | ✅ | – |
| Xem thống kê workspace | – | – | ✅ | ✅ | – |
| Verify JWT | – | – | – | – | ✅ |

---

## 5. LUỒNG TƯƠNG TÁC ĐIỂN HÌNH GIỮA SERVICE

### 5.1. Mời thành viên vào workspace
```
Admin ─► Gateway ─► Workspace-svc.inviteMember
                          │
                          ├─► Auth-svc.getUserByEmail  (xác minh user)
                          ├─► DB.insert workspace_members (status=invited)
                          └─► Noti-svc.create { type: member.invited }
```

### 5.2. Xoá workspace (cascade)
```
Admin ─► Gateway ─► Workspace-svc.delete(:publicId)
                          │
                          ├─► getWorkspaceByPublicId → workspaceId
                          ├─► isAdmin? → 403 nếu không
                          ├─► softDelete workspace
                          ├─► Board-svc.deleteBoardsByWorkspace  (non-critical)
                          └─► Noti-svc.create { type: workspace.deleted } *
* gửi cho mọi member của workspace
```

### 5.3. Tạo card và assign member
```
Member ─► Gateway ─► Board-svc.createCard
                          ├─► Workspace-svc.validateMember
                          ├─► DB.insert card
                          ├─► DB.insert card_activity (card.created)
                          └─► Activity-svc.POST /internal/activities

Member ─► Gateway ─► Board-svc.assignMember
                          ├─► DB.insert _card_workspace_members
                          ├─► DB.insert card_activity (card.updated.member)
                          ├─► Activity-svc.POST /internal/activities
                          └─► Noti-svc.create { type: card.member_assigned }
```

### 5.4. Dashboard thống kê
```
User ─► Gateway ─► Statistic-svc.getDashboard(:workspaceId)
                       ├─► Workspace-svc (kiểm tra membership)
                       ├─► Board-svc.queries (cards, lists, members)
                       └─► Activity-svc.queries (events trong kỳ)
                       └─► Aggregate → JSON response
```

---

## 6. CÁC RÀNG BUỘC NGHIỆP VỤ QUAN TRỌNG

1. **Public ID ở API client, numeric ID ở internal**
   - `DELETE /api/v1/workspaces/:publicId` nhận `publicId` từ UI, controller
     tự resolve sang numeric id để gọi board-service.
2. **Soft delete mặc định** — không bao giờ xoá vật lý record kinh doanh
   (workspace, board, card, member). Có cột `deletedAt`, `deletedBy`.
3. **Cascade non-critical** — Khi xoá workspace, board-service down không
   chặn việc xoá workspace (chỉ log warning). Tránh "stuck delete".
4. **Phân quyền 2 lớp**
   - Lớp 1: `workspace_role_permissions` (per role).
   - Lớp 2: `workspace_member_permissions` (override per user).
5. **Service-to-service không xác thực JWT** — Tin cậy header
   `x-user-id` do gateway truyền. Các endpoint `/internal/*` chỉ được phép
   gọi từ bên trong cluster (không expose qua gateway).
6. **Idempotent cleanup** — Logout tất cả thiết bị, reset password đều
   vô hiệu hoá mọi `session` cũ.
7. **Retention** — Activity log có TTL cấu hình bằng env (`RETENTION_DAYS`).

---

## 7. PHỤ LỤC — BẢNG DỮ LIỆU CHÍNH

| Service | Bảng | Mục đích |
|---------|------|----------|
| auth | `users`, `session`, `account`, `verification` | Người dùng, phiên, OAuth, OTP |
| workspace | `workspace`, `workspace_members`, `workspace_roles`, `workspace_role_permissions`, `workspace_member_permissions`, `board` (reference) | Workspace, thành viên, vai trò, quyền |
| board | `board`, `list`, `card`, `label`, `_card_labels`, `_card_workspace_members`, `card_activity`, `user_board_favorites` | Bảng kanban đầy đủ |
| noti | `notifications` | Thông báo người dùng |
| activity | `workspace_activity` | Audit log per-workspace |
| statistic | (không có bảng — aggregation runtime) | Báo cáo / dashboard |

---

*Tài liệu này được sinh tự động từ source code; mỗi khi endpoint thay đổi,
nên đối chiếu lại với `api-gateway/docs/openapi.ts` và `api/routes/*` của
từng service để đảm bảo đồng bộ.*
