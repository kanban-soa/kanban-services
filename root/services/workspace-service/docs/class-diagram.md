# Class Diagram — Workspace Service

> Kiến trúc 3 tầng **Controller → Service → Repository** + tầng external client.
> Nguồn: `api/controllers/`, `services/`, `repositories/`, `infrastructure/clients/`.

## Tổng quan

Mỗi module tổ chức theo pattern:

- **Controller** — nhận HTTP request, validate input, gọi service.
- **Service** — chứa business logic, dùng repository và client ngoài.
- **Repository** — bọc DB (Drizzle ORM).
- **Client** — bọc HTTP call sang service khác (auth, board, noti).

## Class diagram

```mermaid
classDiagram
    direction LR

    class WorkspaceController {
        +create(req, res)
        +getById(req, res)
        +getAll(req, res)
        +update(req, res)
        +delete(req, res)
        +getDefault(req, res)
    }

    class MemberController {
        +inviteMember(req, res)
        +getMembers(req, res)
        +getMember(req, res)
        +updateMemberRole(req, res)
        +removeMember(req, res)
        +getInvitedMembers(req, res)
        +getMemberSummaries(req, res)
    }

    class PermissionController {
        +getPermissions(req, res)
        +checkPermission(req, res)
        +getRoles(req, res)
        +createRole(req, res)
        +getRolePermissions(req, res)
        +grantPermission(req, res)
    }

    class InternalController {
        +getByPublicId(req, res)
        +getAuthorization(req, res)
        +getMemberMe(req, res)
    }

    class WorkspaceService {
        +createWorkspace(input)
        +getWorkspaceByPublicId(publicId)
        +getWorkspacesByUser(userId)
        +getDefaultWorkspace(userId)
        +updateWorkspace(id, input)
        +deleteWorkspace(id, deletedBy)
        +isMember(wsId, userId) bool
        +isAdmin(wsId, userId) bool
        +getAuthorization(wsId, userId)
    }

    class MemberService {
        +inviteMember(input)
        +getWorkspaceActiveMembers(wsId, limit, offset)
        +getMemberById(memberId)
        +getMemberByUserAndWorkspace(userId, wsId)
        +updateMemberRole(id, input)
        +removeMember(id, removedBy)
        +getMemberSummaries(wsId, ids)
        +getInvitedMembers(wsId)
    }

    class PermissionService {
        +createRole(input)
        +getWorkspaceRoles(wsId)
        +grantPermissionToRole(roleId, permission)
        +getRolePermissions(roleId)
        +memberHasPermission(memberId, permission) bool
        +roleHasPermission(roleId, permission) bool
    }

    class WorkspaceRepository {
        +create(input)
        +findById(id)
        +findByPublicId(publicId)
        +findLatestByUser(userId)
        +update(id, input)
        +softDelete(id, deletedBy)
        +slugExists(slug, excludeId) bool
    }

    class MemberRepository {
        +create(input)
        +findById(id)
        +findByUserAndWorkspace(userId, wsId)
        +findWorkspacesByUserId(userId)
        +findActiveMembersByWorkspace(wsId, limit, offset)
        +countByWorkspace(wsId)
        +memberExistsByEmail(email, wsId)
        +findAdminsByWorkspace(wsId)
        +softDelete(id, deletedBy)
    }

    class PermissionRepository {
        +createRole(input)
        +getRoleById(id)
        +getRoleByName(wsId, name)
        +getRolesByWorkspace(wsId)
        +createRolePermission(input)
        +roleHasPermission(roleId, permission) bool
        +getRolePermissions(roleId)
        +getMemberPermissions(memberId)
    }

    class AuthClient {
        +getUserById(userId)
        +getUserByEmail(email)
        +getUsersByIds(ids)
        +checkUserExists(userId) bool
    }

    class BoardClient {
        +getBoardsByWorkspace(wsId)
        +deleteBoardsByWorkspace(wsId, deletedBy)
    }

    %% ===== Dependencies =====
    WorkspaceController --> WorkspaceService
    WorkspaceController --> PermissionService
    WorkspaceController --> BoardClient

    MemberController --> WorkspaceService
    MemberController --> MemberService

    PermissionController --> WorkspaceService
    PermissionController --> PermissionService
    PermissionController --> MemberRepository

    InternalController --> WorkspaceService
    InternalController --> MemberService

    WorkspaceService --> WorkspaceRepository
    WorkspaceService --> MemberRepository
    WorkspaceService --> AuthClient

    MemberService --> MemberRepository
    MemberService --> AuthClient

    PermissionService --> PermissionRepository
    PermissionService --> MemberRepository
```

## Ghi chú

- Service và Repository được export dưới dạng **singleton instance** (vd. `workspaceService`, `workspaceRepository`) cho phép import trực tiếp, đơn giản hoá dependency injection.
- Client (`authClient`, `boardClient`, `notificationClient`) kế thừa `BaseClient` (axios-based) trong `infrastructure/clients/base.client.ts`.
- Tầng repository implement interface DAO (xem `repositories/dao/`) — thuận tiện cho việc mock trong unit test.
