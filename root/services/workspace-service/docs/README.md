# Workspace Service Documentation

This directory contains comprehensive documentation for the Workspace Service microservice.

## Documents

### 📋 [api-spec.yaml](./api-spec.yaml)
OpenAPI 3.0 specification for all Workspace Service REST APIs.

**Endpoints**:
```
GET    /workspaces                     List workspaces
POST   /workspaces                     Create workspace
GET    /workspaces/{id}                Get workspace detail
PATCH  /workspaces/{id}                Update workspace
DELETE /workspaces/{id}                Delete workspace

GET    /workspaces/{id}/members        List members
POST   /workspaces/{id}/members        Add member
PATCH  /workspaces/{id}/members        Update member role
DELETE /workspaces/{id}/members        Remove member

GET    /workspaces/{id}/permissions    Get permissions
POST   /workspaces/{id}/permissions    Update permissions
PUT    /workspaces/{id}/permissions    Set permissions
```

**Features**:
- ✅ Complete request/response schemas
- ✅ Security schemes (JWT Bearer)
- ✅ Error responses
- ✅ Importable to Swagger/Postman

**Usage**: Import into Swagger UI, Postman, or any OpenAPI-compatible tool for interactive API documentation.

---

### 🔌 [webhook.md](./webhook.md)
Complete guide to event-driven communication in the Workspace Service.

**Event-Driven Communication** - Async inter-service events

**Inbound Events** (7 total):
```
user.created               User account created
user.updated               User profile updated
user.deleted               User account deleted (CRITICAL)
workspace.invitation.accepted   Member accepts invite
workspace.invitation.rejected   Member rejects invite
[Additional internal events]
```

**Outbound Events** (11 total):
```
workspace.created          New workspace created
workspace.updated          Workspace details changed
workspace.deleted          Workspace deleted
workspace.plan.changed     Plan upgraded/downgraded
member.invited             Invitation sent
member.added               Member joined
member.role.changed        Role updated
member.removed             Member left
permissions.updated        Permissions changed
[Additional events]
```

**Key Events**:
| Event | Source | Action |
|-------|--------|--------|
| `user.deleted` | Auth Service | Mark members as deleted |
| `workspace.invitation.accepted` | Auth Service | Update member status |
| `workspace.created` | Internal | Notify Billing/Analytics |
| `member.invited` | Internal | Notify Auth Service |
| `member.removed` | Internal | Notify Card Service |
| `permissions.updated` | Internal | Invalidate caches |

---

### 🏗️ [architecture.md](./architacture.md)
Deep dive into the microservice architecture and design decisions.

**Sections**:

1. **Service Overview** - Purpose, tech stack, characteristics
2. **Architecture Diagram** - Visual service components and flows
3. **Data Isolation** - Service boundaries, soft links pattern
4. **Database Schema** - Complete table definitions, relationships, indexes
5. **Security** - Authentication, authorization, RBAC, data validation
6. **API Design** - REST principles, request/response formats, pagination
7. **Integration Patterns** - Async events, service discovery, caching, circuit breakers
8. **Deployment Architecture** - Development and production setups
9. **Monitoring & Observability** - Metrics, logging, health checks
10. **Future Enhancements** - Planned features

**Key Design Decisions**:
- ✅ Soft links (no FK to Auth Service)
- ✅ Async event-based integration
- ✅ Row-level security enabled
- ✅ Stateless service (horizontally scalable)
- ✅ RBAC with custom roles

---

## Quick Navigation

### For API Consumers
Start with: **api-spec.yaml** → Interactive API documentation

### For Backend Developers
Start with: **architecture.md** → Understanding service design

### For Integration Engineers
Start with: **webhook.md** → Event handling and inter-service communication

### For DevOps/Infrastructure
Start with: **architecture.md** → Deployment and monitoring sections

---

## Key Concepts

### Soft Links Pattern
User references in workspace service are UUID fields without foreign key constraints:

```typescript
// Auth Service owns users table
// Workspace Service stores user UUIDs as soft links
userId: uuid("userId") // No FK constraint
createdBy: uuid("createdBy") // No FK constraint
```

**Benefits**:
- Independent database scaling
- No cascading deletes across services
- Handles user deletion via async events
- Reduced coupling between services

### Role-Based Access Control (RBAC)
Three built-in roles with customizable permissions:

```
Admin: All permissions (workspace creation, member management, settings)
Member: Can create and edit boards (within workspace)
Guest: Read-only access to shared resources
```

### Event-Driven Integration
Services communicate via async webhooks:

```
User deleted in Auth Service
        ↓
Publishes "user.deleted" event
        ↓
Workspace Service receives webhook
        ↓
Marks members as deleted
        ↓
Publishes "member.removed" event
        ↓
Card Service handles cascading cleanup
```

---

## Database Schema Summary

```
workspaces (1) ──────┐
                     ├─→ (N) workspace_members
                     ├─→ (N) boards
                     └─→ (N) workspace_roles ──→ (N) workspace_role_permissions
```

**Key Tables**:
- `workspaces` - Workspace metadata
- `workspace_members` - User memberships with roles and status
- `boards` - Kanban boards within workspaces
- `workspace_roles` - Custom roles per workspace
- `workspace_role_permissions` - Granular permissions per role

**Features**:
- ✅ Soft deletes (deletedAt timestamp)
- ✅ RLS enabled on all tables
- ✅ Comprehensive indexing
- ✅ Audit fields (createdBy, deletedBy)

---

## Security Model

```
Request
  ↓
Authentication (JWT validation)
  ↓
Authorization (Role-based access control)
  ↓
Input Validation (Schema validation)
  ↓
SQL Injection Prevention (Drizzle ORM parameterization)
  ↓
Audit Logging (All actions logged)
```

---

## Environment Configuration

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/workspace_db

# Server
NODE_ENV=development
PORT=3001

# Auth
JWT_SECRET=your-secret-key (if validating locally)
AUTH_SERVICE_URL=http://auth-service:3000

# Events
WEBHOOK_SECRET=signing-secret
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=5000

# Monitoring
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
```

---

## Running the Service

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker compose up -d

# Run migrations
npm run db:push

# Start development server
npm run dev

# Or from root workspace
npm run workspace:dev
```

Server will be available at: `http://localhost:3001`

---

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### Webhook Testing
```bash
npm run webhook:test
```

### API Documentation
- **OpenAPI**: [api-spec.yaml](./api-spec.yaml)
- **Swagger UI**: `http://localhost:3001/api-docs`
- **Postman Collection**: [Coming soon]

---

## Support & Questions

- 📖 Documentation: Review relevant .md file
- 🐛 Issues: Check GitHub issues
- 💬 Questions: Create a discussion

---

## Document Maintenance

| Document | Last Updated | Next Review |
|----------|--------------|-------------|
| api-spec.yaml | 2024-01-15 | 2024-02-15 |
| webhook.md | 2024-01-15 | 2024-02-15 |
| architecture.md | 2024-01-15 | 2024-02-15 |
| README.md (this file) | 2024-01-15 | 2024-02-15 |

Keep these documents in sync with code changes, especially when:
- Adding new API endpoints
- Modifying event structure
- Changing database schema
- Updating security policies
