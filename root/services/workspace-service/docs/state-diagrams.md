# State Diagrams — Workspace Service

> Vòng đời các thực thể chính, biểu diễn bằng `stateDiagram-v2` của Mermaid.

## 1. Vòng đời `workspace_members.status`

Schema có 3 trạng thái: `active`, `paused`, `removed` (xem `config/constants.ts → MEMBER_STATUS`).
Trong code hiện tại, member được tạo thẳng với `status = active` khi admin mời (`member.service.inviteMember`).

```mermaid
stateDiagram-v2
    [*] --> active: Mời thành công<br/>POST /:id/members
    active --> paused: Admin tạm dừng
    paused --> active: Admin kích hoạt lại
    active --> removed: Xoá khỏi workspace<br/>DELETE /:id/members/:memberId
    paused --> removed: Xoá khỏi workspace
    removed --> [*]

    note right of active
        Member có thể truy cập workspace,
        thấy trong danh sách members.
    end note

    note right of removed
        Soft delete: deletedAt, deletedBy
        được gán. Không hiển thị nữa.
    end note
```

> Lưu ý: schema còn định nghĩa giá trị mặc định DB là `invited`, nhưng các flow hiện tại đều tạo thẳng `active`. Nếu mở rộng flow "invite → user accept" thì cần thêm state `invited` trước `active`.

---

## 2. Vòng đời `workspace`

```mermaid
stateDiagram-v2
    [*] --> active: createWorkspace<br/>POST /api/workspaces
    active --> active: updateWorkspace<br/>PATCH /api/workspaces/:id
    active --> soft_deleted: deleteWorkspace<br/>DELETE /api/workspaces/:id
    soft_deleted --> [*]

    note right of soft_deleted
        Cột deletedAt và deletedBy được gán.
        Bị loại khỏi getWorkspacesByUser.
        Cascade xoá board best-effort.
    end note
```

---

## 3. Vòng đời `workspace_roles`

Role được tạo thuộc 1 workspace (`isSystem = true` cho role "Admin" mặc định, `false` cho role tuỳ chỉnh).

```mermaid
stateDiagram-v2
    [*] --> system_admin: Tạo workspace<br/>auto-create role Admin (isSystem=true)
    [*] --> custom: POST /:id/roles<br/>(isSystem=false)
    custom --> custom: PATCH role (mở rộng)
    custom --> [*]: ON DELETE CASCADE<br/>khi xoá workspace
    system_admin --> [*]: ON DELETE CASCADE<br/>khi xoá workspace

    note right of system_admin
        Role hệ thống do code tạo,
        không xoá thủ công được.
    end note
```
