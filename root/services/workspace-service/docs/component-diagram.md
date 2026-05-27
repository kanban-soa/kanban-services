# Component / Deployment Diagram — Workspace Service

> Vị trí của `workspace-service` trong hệ microservice và các thành phần phụ thuộc.

## Sơ đồ

```mermaid
graph TB
    subgraph Client
        UI["Web UI / Mobile"]
    end

    subgraph Edge
        GW["API Gateway<br/>:8000"]
    end

    subgraph Services
        AUTH["auth-service<br/>:9001"]
        WS["workspace-service<br/>:3001"]
        BOARD["board-service<br/>:9003"]
        NOTI["noti-service<br/>:9004"]
        ACT["activity-service"]
    end

    subgraph Data
        DBWS[("Postgres<br/>workspace")]
        DBAUTH[("Postgres<br/>auth")]
        DBBOARD[("Postgres<br/>board")]
    end

    UI -->|HTTPS| GW
    GW -->|"x-user-* headers"| WS
    GW --> AUTH
    GW --> BOARD

    WS -->|"GET /internal/v1/auth/users"| AUTH
    WS -->|"DELETE /api/boards"| BOARD
    WS -. "notify (mở rộng)" .-> NOTI

    BOARD -->|"/internal/workspaces/:id/authorization"| WS
    ACT -->|"/internal/workspaces/by-public-id"| WS

    WS --> DBWS
    AUTH --> DBAUTH
    BOARD --> DBBOARD
```

## Các luồng truyền thông chính

| Hướng | Endpoint dùng | Mục đích |
|---|---|---|
| WS → AUTH | `GET /internal/v1/auth/users/:id` | Lấy email người tạo workspace |
| WS → AUTH | `GET /internal/v1/auth/users?email=` | Xác minh email khi mời thành viên |
| WS → BOARD | `DELETE /api/boards?workspaceId=` | Cascade xoá board khi xoá workspace (best-effort) |
| BOARD → WS | `GET /internal/workspaces/:id/members/:userId/authorization` | Kiểm tra user có phải admin/owner workspace không |
| ACT → WS | `GET /internal/workspaces/by-public-id/:publicId` | Resolve publicId → id nội bộ |

## Cấu hình URL service (env)

| Biến | Default | Service nào |
|---|---|---|
| `AUTH_SERVICE_URL` | `http://localhost:9001` | auth-service |
| `BOARD_SERVICE_URL` | `http://localhost:9003` | board-service |
| `NOTIFICATION_SERVICE_URL` | `http://localhost:9004` | noti-service |
| `GATEWAY_URL` | `http://localhost:8000` | gateway |

## Lưu ý kiến trúc

- Các route `/internal/*` của workspace-service **không** có middleware xác thực — gateway/service mesh phải bảo vệ ở mức network để không expose ra ngoài.
- Tất cả request từ public Internet phải đi qua API Gateway; gateway gắn 3 header `x-user-id`, `x-user-email`, `x-user-role` rồi forward đến workspace-service.
- Workspace-service không gọi trực tiếp activity-service. Activity-service tự pull workspace info qua `/internal`.
