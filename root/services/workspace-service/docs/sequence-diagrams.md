# Sequence Diagrams — Workspace Service

> Trình tự gọi giữa các tầng (Controller → Service → Repository → external client)
> cho các luồng nghiệp vụ quan trọng. Trích từ code thật trong `services/`, `api/controllers/`.

Mục lục:
1. [Tạo workspace](#1-tạo-workspace)
2. [Xoá workspace (best-effort cascade)](#2-xoá-workspace-best-effort-cascade)
3. [Mời thành viên](#3-mời-thành-viên)
4. [Kiểm tra permission](#4-kiểm-tra-permission)

---

## 1. Tạo workspace

`POST /api/workspaces`

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant GW as Gateway
    participant CTL as WorkspaceController
    participant WS as WorkspaceService
    participant WSR as workspaceRepository
    participant MR as memberRepository
    participant PS as PermissionService
    participant AUTH as authService

    U->>GW: POST /api/workspaces với name
    GW->>CTL: forward kèm x-user-id headers
    CTL->>CTL: validate name không rỗng
    CTL->>WS: createWorkspace(name, createdBy)
    WS->>WSR: slugExists(slug)
    WSR-->>WS: false hoặc true
    Note over WS: Nếu slug trùng thì sinh slug khác
    WS->>WSR: create(workspace)
    WSR-->>WS: workspace row
    WS->>AUTH: GET /internal/v1/auth/users/:id
    AUTH-->>WS: trả id và email
    WS->>MR: create admin member
    MR-->>WS: ok
    WS-->>CTL: workspace đã tạo
    CTL->>PS: createRole(Admin, isSystem=true)
    PS-->>CTL: role
    CTL-->>U: 201 Created và workspace
```

**Các bước chính:**
1. Gateway gắn header `x-user-*` vào request.
2. Controller validate `name`.
3. Service sinh `publicId`, kiểm tra/sinh `slug` duy nhất.
4. Tạo bản ghi workspace.
5. Gọi `auth-service` lấy email người tạo.
6. Tạo member admin tương ứng.
7. Tạo role hệ thống "Admin".

---

## 2. Xoá workspace best-effort cascade

`DELETE /api/workspaces/:id`

```mermaid
sequenceDiagram
    autonumber
    actor U as Admin
    participant CTL as WorkspaceController
    participant WS as WorkspaceService
    participant WSR as workspaceRepository
    participant BC as boardClient
    participant BS as boardService

    U->>CTL: DELETE /api/workspaces/:publicId
    CTL->>WS: getWorkspaceByPublicId(publicId)
    WS-->>CTL: workspace
    CTL->>WS: isAdmin(workspaceId, userId)
    WS-->>CTL: true
    CTL->>WS: deleteWorkspace(workspaceId, userId)
    WS->>WSR: softDelete(id, userId)
    WSR-->>WS: deletedAt và deletedBy
    WS-->>CTL: ok

    rect rgb(245, 245, 245)
    Note over CTL,BS: Cascade best-effort sang board-service
    CTL->>BC: deleteBoardsByWorkspace(workspaceId, userId)
    BC->>BS: DELETE /api/boards?workspaceId=
    alt board-service trả 200
        BS-->>BC: 200 OK
        BC-->>CTL: thành công
    else board-service lỗi
        BS-->>BC: 5xx hoặc timeout
        BC-->>CTL: throw error
        CTL->>CTL: log warning và KHÔNG rollback
    end
    end

    CTL-->>U: 204 No Content
```

**Điểm quan trọng:** Bước cascade sang board-service là **best-effort** — nếu lỗi chỉ log warning, vẫn trả 204 cho client. Workspace đã được soft-delete trước đó.

---

## 3. Mời thành viên

`POST /api/workspaces/:id/members`

```mermaid
sequenceDiagram
    autonumber
    actor U as Admin
    participant CTL as MemberController
    participant WS as WorkspaceService
    participant MS as MemberService
    participant MR as memberRepository
    participant AUTH as authService

    U->>CTL: POST /:id/members với email
    CTL->>WS: getWorkspaceByPublicId(id)
    WS-->>CTL: workspace
    CTL->>WS: isAdmin(workspaceId, userId)
    WS-->>CTL: true
    CTL->>CTL: validate email không rỗng

    CTL->>MS: inviteMember(email, workspaceId)
    MS->>AUTH: GET /internal/v1/auth/users?email=
    alt Email chưa đăng ký
        AUTH-->>MS: 404
        MS-->>CTL: throw USER_NOT_REGISTERED 1051
        CTL-->>U: 400 Bad Request
    else Email đã đăng ký
        AUTH-->>MS: trả id và email
        MS->>MR: memberExistsByEmail(email, ws)
        alt Đã là member
            MR-->>MS: true
            MS-->>CTL: throw DUPLICATE_MEMBER 1011
            CTL-->>U: 409 Conflict
        else Chưa là member
            MR-->>MS: false
            MS->>MR: create role=member và status=active
            MR-->>MS: member row
            MS-->>CTL: member
            CTL-->>U: 201 Created
        end
    end
```

---

## 4. Kiểm tra permission

Áp dụng cho:
- `GET /api/workspaces/:id/permissions?permission=<name>`
- `POST /api/workspaces/:id/permissions` (body: `{ permission }`)

Logic: **role-permission trước, fallback xuống member-permission override**.

```mermaid
sequenceDiagram
    autonumber
    participant CTL as PermissionController
    participant PS as PermissionService
    participant MR as memberRepository
    participant PR as permissionRepository

    CTL->>MR: findByUserAndWorkspace(userId, wsId)
    MR-->>CTL: member với roleId
    CTL->>PS: memberHasPermission(memberId, permission)
    PS->>MR: findById(memberId)
    MR-->>PS: member row

    alt Member có roleId
        PS->>PR: roleHasPermission(roleId, permission)
        alt Role có permission
            PR-->>PS: true
            PS-->>CTL: true
        else Role không có
            PR-->>PS: false
            PS->>PR: getMemberPermissions(memberId)
            PR-->>PS: list overrides
            alt Override granted=true cho permission
                PS-->>CTL: true
            else Không có override
                PS-->>CTL: false
            end
        end
    else Member không có role
        PS->>PR: getMemberPermissions(memberId)
        PR-->>PS: list overrides
        PS-->>CTL: kết quả theo override
    end
```
