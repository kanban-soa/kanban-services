# Workspace Service - Architecture Documentation

## Table of Contents

1. [Service Overview](#service-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Data Isolation](#data-isolation)
4. [Database Schema](#database-schema)
5. [Security](#security)
6. [API Design](#api-design)
7. [Integration Patterns](#integration-patterns)

---

## Service Overview

### Purpose

The Workspace Service is a dedicated microservice responsible for:
- **Workspace Management**: Creating, updating, and deleting workspaces
- **Board Management**: Managing kanban boards within workspaces
- **Member Management**: Handling workspace memberships, roles, and invitations
- **Permission Control**: Implementing role-based access control (RBAC)
- **Metadata Storage**: Storing workspace configuration and settings

### Technology Stack

- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT (Bearer Token from Auth Service)
- **API**: REST with OpenAPI 3.0 specification
- **Event System**: Webhook-based event publishing/subscribing

### Service Characteristics

| Aspect | Details |
|--------|---------|
| **Deployment** | Containerized (Docker) |
| **Port** | 3001 (development), 9005 (production) |
| **Database** | Isolated PostgreSQL instance |
| **State** | Stateless (horizontally scalable) |
| **Communication** | REST API, Webhooks, Inter-service events |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client / API Gateway                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    JWT Token (BearerAuth)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     Workspace Service                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Express Server                          │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │         API Routes & Controllers                     │ │   │
│  │  │  • GET/POST /workspaces                             │ │   │
│  │  │  • PATCH/DELETE /workspaces/{id}                    │ │   │
│  │  │  • GET/POST /workspaces/{id}/members                │ │   │
│  │  │  • GET/POST /workspaces/{id}/permissions            │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                       │                                    │   │
│  │  ┌────────────────────▼──────────────────────────────┐   │   │
│  │  │       Business Logic Layer (Services)              │   │   │
│  │  │  • WorkspaceService                                │   │   │
│  │  │  • MemberService                                   │   │   │
│  │  │  • PermissionService                               │   │   │
│  │  │  • AuthorizationMiddleware                         │   │   │
│  │  └─────────────────┬──────────────────────────────────┘   │   │
│  │                    │                                        │   │
│  │  ┌─────────────────▼──────────────────────────────────┐   │   │
│  │  │    Data Access Layer (Drizzle ORM)                 │   │   │
│  │  │  • Query builders                                  │   │   │
│  │  │  • Relationship handling                           │   │   │
│  │  │  • Transaction management                          │   │   │
│  │  └─────────────────┬──────────────────────────────────┘   │   │
│  │                    │                                        │   │
│  └────────────────────┼────────────────────────────────────────┘   │
│                       │                                            │
└───────────────────────┼────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    PostgreSQL    Webhook Bus    Auth Service
 (workspace_db)   (Event Queue)   (Verify JWT)
        │               │               │
   ┌────┴───────────┬───┴────────┬─────┴──────────┐
   │                │            │                │
   ▼                ▼            ▼                ▼
 Billing       Notification  Analytics      Card Service
 Service       Service       Service        (future)
```

---

## Data Isolation

### Service-Level Isolation

**Principle**: Each microservice manages its own data store with no direct cross-service database access.

```
┌──────────────────────────┐
│   Auth Service           │
│   ├─ users               │
│   ├─ sessions            │
│   └─ verification_tokens │
│   Database: auth_db      │
└──────────────────────────┘

┌──────────────────────────┐
│  Workspace Service       │
│   ├─ workspaces          │
│   ├─ boards              │
│   ├─ workspace_members   │
│   ├─ workspace_roles     │
│   └─ permissions         │
│   Database: workspace_db │
└──────────────────────────┘

┌──────────────────────────┐
│   Card Service (future)  │
│   ├─ cards               │
│   ├─ lists               │
│   └─ labels              │
│   Database: card_db      │
└──────────────────────────┘
```

### User Reference Strategy (Soft Links)

**Problem**: Tight coupling through foreign keys creates cascading issues across services.

**Solution**: Use UUIDs as soft links without database foreign key constraints.

```typescript
// ❌ WRONG - Creates FK dependency on Auth Service
userId: uuid("userId")
  .notNull()
  .references(() => users.id, { onDelete: "cascade" })

// ✅ CORRECT - Soft link, no FK constraint
userId: uuid("userId") // Soft link to Auth Service
```

### Benefits

1. **Service Independence**: Workspace Service operates independently
2. **Data Deletion Handling**: User deletion handled via async events, not cascades
3. **Reduced Coupling**: No compile-time or runtime dependencies on Auth Service schema
4. **Flexible Cleanup**: Can implement custom cleanup logic in application layer

### Data Consistency Pattern

```
User Deletion Flow:
┌──────────────┐
│ Auth Service │
│ user.delete  │
└──────┬───────┘
       │
       │ publishes event
       │ "user.deleted"
       │
       ▼
┌──────────────────────┐
│ Workspace Service    │
│ Webhook Handler      │
│ 1. Find members      │
│ 2. Soft delete them  │
│ 3. Publish event     │
│ 4. Notify consumers  │
└──────────────────────┘
       │
       │ publishes event
       │ "member.removed"
       │
       ▼
┌──────────────────────┐
│ Card Service         │
│ Webhook Handler      │
│ 1. Revoke access     │
│ 2. Archive boards    │
│ 3. Update assignments│
└──────────────────────┘
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────┐
│      workspaces         │
├─────────────────────────┤
│ id (PK)                 │
│ publicId (UNIQUE)       │
│ name                    │
│ slug (UNIQUE)           │
│ plan (enum)             │
│ showEmailsToMembers     │
│ createdBy (UUID - soft) │
│ createdAt               │
│ updatedAt               │
│ deletedAt (soft delete) │
│ deletedBy (UUID - soft) │
└────────┬────────────────┘
         │ 1:N
         │
    ┌────▼─────────────────────────────┐
    │   workspace_members              │
    ├──────────────────────────────────┤
    │ id (PK)                          │
    │ publicId (UNIQUE)                │
    │ email                            │
    │ userId (UUID - soft link)        │
    │ workspaceId (FK)                 │
    │ role (enum)                      │
    │ roleId (FK to workspace_roles)   │
    │ status (enum)                    │
    │ createdBy (UUID - soft)          │
    │ createdAt                        │
    │ updatedAt                        │
    │ deletedAt (soft delete)          │
    │ deletedBy (UUID - soft)          │
    └─────────────────────────────────┘

┌──────────────────────────────────────┐
│    workspace_roles                   │
├──────────────────────────────────────┤
│ id (PK)                              │
│ publicId (UNIQUE)                    │
│ workspaceId (FK)                     │
│ name                                 │
│ description                          │
│ hierarchyLevel                       │
│ isSystem (for built-in roles)        │
│ createdAt                            │
│ updatedAt                            │
└────────┬─────────────────────────────┘
         │ 1:N
         │
┌────────▼─────────────────────────────┐
│  workspace_role_permissions          │
├──────────────────────────────────────┤
│ id (PK)                              │
│ workspaceRoleId (FK)                 │
│ permission (VARCHAR)                 │
│ granted (BOOLEAN)                    │
│ createdAt                            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│    boards                            │
├──────────────────────────────────────┤
│ id (PK)                              │
│ publicId (UNIQUE)                    │
│ name                                 │
│ description                          │
│ slug                                 │
│ workspaceId (FK) ──┐ 1:N to boards   │
│ createdBy (soft)   │                 │
│ visibility (enum)  │ private/public  │
│ type (enum)        │ regular/template│
│ sourceBoardId      │ for templating  │
│ createdAt          │                 │
│ updatedAt          │                 │
│ deletedAt (soft)   │                 │
│ deletedBy (soft)   │                 │
└──────────────────────────────────────┘
```

### Table Specifications

#### workspaces
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incremented |
| publicId | VARCHAR(12) | UNIQUE, NOT NULL | User-facing ID |
| name | VARCHAR(255) | NOT NULL | Display name |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly identifier |
| plan | ENUM | NOT NULL, DEFAULT 'free' | free\|pro\|enterprise |
| showEmailsToMembers | BOOLEAN | NOT NULL, DEFAULT true | Privacy setting |
| createdBy | UUID | NOT NULL | Soft link to Auth Service |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | | Last update |
| deletedAt | TIMESTAMP | | Soft delete marker |
| deletedBy | UUID | | Who deleted it |

**Indexes**:
- Primary: id
- Unique: publicId, slug
- Regular: createdBy, deletedBy, deletedAt

#### workspace_members
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incremented |
| publicId | VARCHAR(12) | UNIQUE, NOT NULL | User-facing ID |
| email | VARCHAR(255) | NOT NULL | Member email |
| userId | UUID | NULLABLE | Soft link to Auth Service |
| workspaceId | BIGINT | FK, NOT NULL | References workspaces.id |
| role | ENUM | NOT NULL | Enum: admin, member, guest |
| roleId | BIGINT | FK | Custom role reference |
| status | ENUM | NOT NULL, DEFAULT 'invited' | invited\|active\|removed\|paused |
| createdBy | UUID | NOT NULL | Soft link to inviter |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | | Last update |
| deletedAt | TIMESTAMP | | Soft delete marker |
| deletedBy | UUID | | Who deleted it |

**Indexes**:
- Primary: id
- Unique: publicId
- Foreign Keys: workspaceId, roleId
- Regular: userId, workspaceId, roleId, deletedAt

#### boards
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incremented |
| publicId | VARCHAR(12) | UNIQUE, NOT NULL | User-facing ID |
| name | VARCHAR(255) | NOT NULL | Display name |
| description | TEXT | | Optional description |
| slug | VARCHAR(255) | NOT NULL | URL-friendly identifier |
| workspaceId | BIGINT | FK, NOT NULL | References workspaces.id |
| visibility | ENUM | NOT NULL, DEFAULT 'private' | private\|public |
| type | ENUM | NOT NULL, DEFAULT 'regular' | regular\|template |
| sourceBoardId | BIGINT | FK | For board cloning |
| createdBy | UUID | | Soft link to creator |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | | Last update |
| deletedAt | TIMESTAMP | | Soft delete marker |
| deletedBy | UUID | | Who deleted it |

**Indexes**:
- Primary: id
- Unique: publicId
- Unique: workspaceId + slug (WHERE deletedAt IS NULL)
- Regular: workspaceId, visibility, type, createdBy, deletedBy

#### workspace_roles
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incremented |
| publicId | VARCHAR(12) | UNIQUE, NOT NULL | User-facing ID |
| workspaceId | BIGINT | FK, NOT NULL | References workspaces.id |
| name | VARCHAR(64) | NOT NULL | Role name (e.g., "Admin") |
| description | VARCHAR(255) | | Description of role |
| hierarchyLevel | INTEGER | NOT NULL | For role ordering (0=highest) |
| isSystem | BOOLEAN | NOT NULL, DEFAULT false | Built-in role flag |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | | Last update |

**Constraints**:
- Unique: workspaceId + name

**Indexes**:
- Primary: id
- Unique: publicId
- Regular: workspaceId

#### workspace_role_permissions
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incremented |
| workspaceRoleId | BIGINT | FK, NOT NULL | References workspace_roles.id |
| permission | VARCHAR(64) | NOT NULL | Permission string |
| granted | BOOLEAN | NOT NULL, DEFAULT true | Allow/deny |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |

**Constraints**:
- Unique: workspaceRoleId + permission

**Indexes**:
- Primary: id
- Regular: workspaceRoleId

### Row-Level Security (RLS)

All tables have RLS enabled:

```sql
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
```

**Policy**: Access controlled at application layer; database policy enforced as secondary constraint.

---

## Security

### 1. Authentication

**Strategy**: JWT Token Validation

```
Client Request
    │
    ├─ Header: "Authorization: Bearer <JWT>"
    │
    ▼
Express Middleware
    │
    ├─ Extract token from header
    │
    ├─ Verify signature (using Auth Service public key)
    │
    ├─ Check expiration
    │
    ├─ Extract userId claim
    │
    └─ Attach to request context
```

**Implementation**:

```typescript
// middleware/auth.ts
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = extractBearerToken(req.headers.authorization);
  
  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }
  
  try {
    const decoded = verifyJWT(token);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
```

### 2. Authorization (RBAC)

**Role-Based Access Control** using workspace roles:

```
User (UUID)
    │
    ├─ workspace_member(role="admin")
    │   ├─ workspace_role(hierarchyLevel=0)
    │   └─ workspace_role_permissions: all granted
    │
    └─ workspace_member(role="member")
        ├─ workspace_role(hierarchyLevel=2)
        └─ workspace_role_permissions: limited
```

**Permission Matrix**:

| Action | Admin | Member | Guest |
|--------|-------|--------|-------|
| View Workspace | ✅ | ✅ | ❌ |
| Edit Workspace | ✅ | ❌ | ❌ |
| Delete Workspace | ✅ | ❌ | ❌ |
| Invite Members | ✅ | ❌ | ❌ |
| Manage Roles | ✅ | ❌ | ❌ |
| Create Board | ✅ | ✅ | ❌ |
| Edit Board | ✅ | ✅ | ❌ |
| View Board | ✅ | ✅ | ✅ |

**Implementation**:

```typescript
// middleware/authorization.ts
export const requireRole = (requiredRole: 'admin' | 'member' | 'guest') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    
    const member = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
      .and(eq(workspaceMembers.workspaceId, workspaceId))
      .and(isNull(workspaceMembers.deletedAt));
    
    if (!member) {
      return res.status(403).json({ error: "Not a workspace member" });
    }
    
    const hasRole = checkRoleHierarchy(member[0].role, requiredRole);
    if (!hasRole) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    next();
  };
};
```

### 3. Data Validation

**Input Validation**:

```typescript
// Workspace creation payload
const createWorkspaceSchema = {
  name: { 
    type: 'string', 
    minLength: 1, 
    maxLength: 255, 
    required: true 
  },
  slug: { 
    type: 'string', 
    pattern: '^[a-z0-9-]+$', 
    minLength: 1, 
    maxLength: 255, 
    required: true 
  },
  description: { 
    type: 'string', 
    maxLength: 1000 
  }
};
```

### 4. API Security Headers

```typescript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.header('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.header('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.header('X-XSS-Protection', '1; mode=block');
  
  // Enforce HTTPS
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // CORS
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');
  
  next();
});
```

### 5. SQL Injection Prevention

**Solution**: Use Drizzle ORM's parameterized queries

```typescript
// ❌ VULNERABLE
const member = await db.execute(`
  SELECT * FROM workspace_members 
  WHERE email = '${email}'
`);

// ✅ SAFE - Drizzle handles parameterization
const member = await db
  .select()
  .from(workspaceMembers)
  .where(eq(workspaceMembers.email, email));
```

### 6. Sensitive Data Protection

**Rules**:
- Passwords never stored (Auth Service responsibility)
- No sensitive data in logs
- Encrypted database connections (SSL/TLS)
- Rate limiting on API endpoints

**Example**:

```typescript
// ❌ DON'T
console.log(`User ${userId} password: ${password}`);

// ✅ DO
logger.info(`User ${userId} authentication attempt`, { userId });
```

### 7. Audit Trail

All significant actions logged:

```typescript
// Example: Member removal
const auditLog = await db.insert(auditLogs).values({
  action: 'member.removed',
  workspaceId: workspace.id,
  workspaceMemberId: member.id,
  userId: member.userId,
  performedBy: req.user.id,
  changes: { role: member.role, status: 'removed' },
  timestamp: new Date(),
  ipAddress: req.ip,
  userAgent: req.get('user-agent')
});
```

---

## API Design

### REST Principles

- **Resources**: workspaces, members, boards, permissions
- **HTTP Methods**: GET (read), POST (create), PATCH (update), DELETE (remove)
- **Status Codes**: 
  - 200 OK (success)
  - 201 Created (resource created)
  - 204 No Content (delete success)
  - 400 Bad Request (validation error)
  - 401 Unauthorized (auth required)
  - 403 Forbidden (insufficient permissions)
  - 404 Not Found
  - 409 Conflict (business logic error)
  - 422 Unprocessable Entity (invalid data)

### Request/Response Format

**Request**:
```json
{
  "name": "Product Team",
  "slug": "product-team",
  "description": "Team managing product development"
}
```

**Response**:
```json
{
  "id": 42,
  "publicId": "ws_abc123xyz",
  "name": "Product Team",
  "slug": "product-team",
  "plan": "pro",
  "createdAt": "2024-01-15T10:30:00Z",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Pagination

For list endpoints:

```
GET /workspaces?limit=20&offset=0&sort=createdAt:desc

Response:
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150,
    "hasMore": true
  }
}
```

---

## Integration Patterns

### 1. Inter-Service Communication

**Pattern**: Async Events via Webhooks

```
Workspace Service                Auth Service
      │                               │
      │ publishes workspace.created   │
      ├──────────────────────────────>│
      │                               │
      │                     (caches user for context)
      │
      │ POST /webhooks/events
      │   - event: user.deleted
      │<──────────────────────────────┤
      │
      (marks members as deleted)
      (publishes member.removed events)
```

### 2. Service Discovery

**Configuration**:
```env
AUTH_SERVICE_URL=http://auth-service:3000
CARD_SERVICE_URL=http://card-service:3002
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=5000
```

### 3. Circuit Breaker Pattern

For external service calls (future resilience):

```typescript
const authService = createCircuitBreaker({
  url: process.env.AUTH_SERVICE_URL,
  timeout: 5000,
  failureThreshold: 5,
  resetTimeout: 60000
});

// Usage
const userInfo = await authService.get('/users/:id');
```

### 4. Caching Strategy

**Cache Levels**:

1. **Database Query Cache** (5 seconds)
   - Workspace details
   - Member list

2. **Permission Cache** (30 seconds)
   - User role in workspace
   - Permissions for role

3. **User Info Cache** (1 hour)
   - User name, email (updated via events)

```typescript
const getMemberPermissions = memoize(
  async (userId: string, workspaceId: number) => {
    // Query database for role and permissions
  },
  { ttl: 30000 } // 30 seconds
);
```

---

## Deployment Architecture

### Development Environment

```
local:3001
    ├─ Express Server
    ├─ PostgreSQL (docker-compose)
    └─ Hot reload (nodemon)
```

### Production Environment

```
Load Balancer (x2 replicas)
    │
    ├─ Workspace Service Pod 1 :3001
    ├─ Workspace Service Pod 2 :3001
    └─ Workspace Service Pod 3 :3001
        │
        └─ PostgreSQL (CloudSQL / RDS)
           ├─ Replica for read queries
           └─ Backup schedule
```

### Scaling Considerations

- **Horizontal Scaling**: Stateless service (scales linearly)
- **Connection Pooling**: PgBouncer for database connections
- **Caching**: Redis for distributed caching across replicas
- **Load Balancing**: Round-robin or least-connections

---

## Monitoring & Observability

### Metrics

- Request latency (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- Event processing delay
- Active database connections

### Logging

```
Structured logging format:
{
  "timestamp": "ISO8601",
  "level": "info|warn|error",
  "service": "workspace-service",
  "requestId": "correlation-id",
  "userId": "user-uuid",
  "workspaceId": "workspace-id",
  "action": "operation",
  "duration": "milliseconds",
  "status": "success|failure",
  "message": "human-readable message"
}
```

### Health Checks

```
GET /health
{
  "status": "healthy|degraded|unhealthy",
  "checks": {
    "database": "up",
    "auth_service": "up",
    "memory": "85%"
  }
}
```

---

## Future Enhancements

1. **Board & List Management**: Implement card/list APIs
2. **Advanced Permissions**: Granular board-level permissions
3. **Activity Feed**: Workspace audit log API
4. **Integration Webhooks**: Allow external services to subscribe to events
5. **Workspace Analytics**: Usage metrics and statistics
6. **Real-time Collaboration**: WebSocket support for live updates
