# kanban-services
```
/root
│
├── /services
│   ├── /auth-service       <-- Individual microservice
│   ├── /order-service      <-- Individual microservice
│   └── /product-service    <-- Individual microservice
│
├── /common (or /shared)     <-- Shared logic (middlewares, types, utilities)
├── /api-gateway            <-- Entry point for client requests
├── /infra (or /deployments)<-- K8s manifests, Docker Compose, CI/CD scripts
└── package.json            <-- Root dependencies (e.g., Lerna or NX)

```


```
/services/order-service
├── /src
│   ├── /api
│   │   ├── /controllers    <-- Handles req/res logic
│   │   ├── /middlewares    <-- Auth, validation, error handling
│   │   └── /routes         <-- Endpoint definitions
│   ├── /config             <-- Environment variables (dotenv)
│   ├── /data-access        <-- Repositories and DB models
│   ├── /services           <-- Core business logic
│   ├── /utils              <-- Shared utility functions
│   ├── app.js              <-- Express/Fastify app initialization
│   └── server.js           <-- Entry point (starts the server)
├── /tests
│   ├── /unit               <-- Business logic tests
│   └── /integration        <-- API endpoint tests
├── Dockerfile              <-- Service-specific containerization
└── package.json            <-- Service-specific dependencies
```

## Statistics sample data

Populate workspace and board sample data for statistics testing:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/workspace_db" \
BOARD_URL="postgresql://user:password@localhost:5432/board_db" \
npm run seed:stats
```

The script reuses the `stats-acme` and `stats-orbit` workspaces and refreshes their members/boards on each run.
