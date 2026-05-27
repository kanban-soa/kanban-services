# Use Case Diagram Tổng Quát — Workspace Service (UML 2.0)

> Biểu đồ ca sử dụng **tổng quát** cho toàn bộ workspace-service: workspace, thành viên, quyền, role, và route nội bộ.
> Tham chiếu use case workspace-only tại `docs/use-case-diagram.md`.

## 1. Phạm vi (System Boundary)

Hệ thống được mô hình hoá: `Workspace Service`. Bao gồm 14 use case public (UC-WS-01..14) và 3 use case nội bộ (INT-01..03).

## 2. Tác nhân (Actors)

| Actor | Loại | Mô tả |
|---|---|---|
| **User** | primary | Người dùng đã đăng nhập (có `x-user-*` headers do gateway gắn) |
| **Member** | primary | User là thành viên active của workspace |
| **Admin** | primary | Member có `role = admin` |
| **Internal Service** | secondary | board-service, activity-service gọi qua `/internal/*` |

Quan hệ generalization: `Admin → Member → User`.

## 3. Biểu đồ tổng quát

```mermaid
graph LR
    %% ===== Actors =====
    User((User))
    Member((Member))
    Admin((Admin))
    Internal((Internal<br/>Service))

    %% ===== System Boundary =====
    subgraph WSS ["Workspace Service"]
        %% --- Nhóm Workspace ---
        UC1(["UC-WS-01<br/>Tạo workspace"])
        UC2(["UC-WS-02<br/>Xem danh sách workspace"])
        UC3(["UC-WS-03<br/>Xem workspace mặc định"])
        UC4(["UC-WS-04<br/>Xem chi tiết workspace"])
        UC5(["UC-WS-05<br/>Cập nhật workspace"])
        UC6(["UC-WS-06<br/>Xoá workspace"])

        %% --- Nhóm Member ---
        UC7(["UC-WS-07<br/>Mời thành viên"])
        UC8(["UC-WS-08<br/>Xem danh sách thành viên"])
        UC9(["UC-WS-09<br/>Xem chi tiết thành viên"])
        UC10(["UC-WS-10<br/>Cập nhật vai trò"])
        UC11(["UC-WS-11<br/>Xoá thành viên"])

        %% --- Nhóm Permission / Role ---
        UC12(["UC-WS-12<br/>Kiểm tra quyền"])
        UC13(["UC-WS-13<br/>Tạo role tuỳ chỉnh"])
        UC14(["UC-WS-14<br/>Gán permission cho role"])

        %% --- Nhóm Internal ---
        INT1(["INT-01<br/>Resolve workspace theo publicId"])
        INT2(["INT-02<br/>Kiểm tra authorization"])
        INT3(["INT-03<br/>Lấy member của user"])

        %% --- Helper use cases ---
        UCa(["Xác thực qua header<br/>x-user-*"])
        UCb(["Cascade xoá board"])
        UCc(["Xác minh email<br/>qua auth-service"])

        %% ===== Include relations =====
        UC1 -. "«include»" .-> UCa
        UC2 -. "«include»" .-> UCa
        UC3 -. "«include»" .-> UCa
        UC4 -. "«include»" .-> UCa
        UC5 -. "«include»" .-> UCa
        UC6 -. "«include»" .-> UCa
        UC7 -. "«include»" .-> UCa
        UC8 -. "«include»" .-> UCa
        UC9 -. "«include»" .-> UCa
        UC10 -. "«include»" .-> UCa
        UC11 -. "«include»" .-> UCa
        UC12 -. "«include»" .-> UCa
        UC13 -. "«include»" .-> UCa
        UC14 -. "«include»" .-> UCa

        UC6 -. "«include»" .-> UCb
        UC7 -. "«include»" .-> UCc
    end

    %% ===== Associations: User =====
    User --- UC1
    User --- UC2
    User --- UC3

    %% ===== Associations: Member =====
    Member --- UC4
    Member --- UC8
    Member --- UC9
    Member --- UC12

    %% ===== Associations: Admin =====
    Admin --- UC5
    Admin --- UC6
    Admin --- UC7
    Admin --- UC10
    Admin --- UC11
    Admin --- UC13
    Admin --- UC14

    %% ===== Associations: Internal Service =====
    Internal --- INT1
    Internal --- INT2
    Internal --- INT3

    %% ===== Generalization between actors =====
    Admin -. "«extends»" .-> Member
    Member -. "«extends»" .-> User
```

## 4. Phân nhóm use case

### Nhóm A — Workspace (UC-WS-01..06)

| Mã | Tên | Tác nhân chính | Endpoint |
|---|---|---|---|
| UC-WS-01 | Tạo workspace | User | `POST /api/workspaces` |
| UC-WS-02 | Xem danh sách workspace | User | `GET /api/workspaces` |
| UC-WS-03 | Xem workspace mặc định | User | `GET /api/workspaces/default` |
| UC-WS-04 | Xem chi tiết workspace | Member | `GET /api/workspaces/:id` |
| UC-WS-05 | Cập nhật workspace | Admin | `PATCH /api/workspaces/:id` |
| UC-WS-06 | Xoá workspace | Admin | `DELETE /api/workspaces/:id` |

### Nhóm B — Member (UC-WS-07..11)

| Mã | Tên | Tác nhân chính | Endpoint |
|---|---|---|---|
| UC-WS-07 | Mời thành viên | Admin | `POST /api/workspaces/:id/members` |
| UC-WS-08 | Xem danh sách thành viên | Member | `GET /api/workspaces/:id/members` |
| UC-WS-09 | Xem chi tiết thành viên | Member | `GET /api/workspaces/:id/members/:memberId` |
| UC-WS-10 | Cập nhật vai trò thành viên | Admin | `PATCH /api/workspaces/:workspaceId/members/:memberId` |
| UC-WS-11 | Xoá thành viên | Admin / Self | `DELETE /api/workspaces/:id/members/:memberId` |

### Nhóm C — Permission & Role (UC-WS-12..14)

| Mã | Tên | Tác nhân chính | Endpoint |
|---|---|---|---|
| UC-WS-12 | Kiểm tra quyền | Member | `GET/POST /api/workspaces/:id/permissions` |
| UC-WS-13 | Tạo role tuỳ chỉnh | Admin | `POST /api/workspaces/:id/roles` |
| UC-WS-14 | Gán permission cho role | Admin | `POST /api/workspaces/:id/roles/:roleId/permissions` |

### Nhóm D — Internal (INT-01..03)

| Mã | Tên | Tác nhân | Endpoint |
|---|---|---|---|
| INT-01 | Resolve workspace theo publicId | Internal Service | `GET /internal/workspaces/by-public-id/:publicId` |
| INT-02 | Kiểm tra authorization | Internal Service | `GET /internal/workspaces/:workspaceId/members/:userId/authorization` |
| INT-03 | Lấy member của user trong workspace | Internal Service | `GET /internal/workspaces/:id/members/:userId` |

## 5. Ghi chú ký hiệu UML 2.0

- **Actor** — biểu diễn bằng hình tròn (Mermaid không có shape stick-figure native).
- **Use case** — hình bầu dục (`stadium` shape `(["..."])`).
- **System boundary** — khung chữ nhật bao quanh các use case (`subgraph`).
- **Association** — đường liền giữa actor và use case (`---`).
- **Generalization** — mũi tên đứt nhãn `«extends»` từ actor con tới actor cha.
- **«include»** — mũi tên đứt từ use case gốc tới use case bắt buộc dùng.
- **«extend»** — (không có ví dụ ở biểu đồ này) mũi tên đứt từ use case mở rộng tới use case gốc.

## 6. Tham chiếu chi tiết

- `docs/use-case-diagram.md` — biểu đồ thu gọn chỉ phần workspace (UC-WS-01..06).
- `docs/sequence-diagrams.md` — sequence diagram của các luồng quan trọng.
- `workspace-usecase-testplan.md` (root) — đặc tả chi tiết từng use case.
- `__tests__/TEST_RESULTS.md` — kết quả kiểm thử các use case workspace.
