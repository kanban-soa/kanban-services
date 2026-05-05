# Board Service Workflow

## Scope

This document summarizes the expected API surface from the test plan and describes the intended request flow of the board-service. It reflects the current codebase state (routes/controllers/services/repositories are empty) and the workflow the service should follow once implemented.

## Folder Responsibilities

This section explains what each folder does and how the layers interact.

- api/
  - routes/: define HTTP paths, bind controller handlers, and attach auth/role middleware.
  - controllers/: validate request input, map DTOs, and call services.

- services/
  - application business logic. Enforces permissions, invariants, and orchestration across repositories.

- repositories/
  - data access layer. Wraps Drizzle queries and returns persistence models.

- schema/
  - Drizzle schema definitions and relations for PostgreSQL tables.

- config/
  - database connection and shared configuration (env parsing, pool setup).

- middlewares/
  - Express middleware like auth, request validation, and error handling.

- dto/
  - request/response shapes (DTOs) and input validation schemas.

- shared/
  - shared error helpers and utilities used across layers.

- docs/
  - test plan and service documentation.

## Interaction Model

The service follows a layered architecture:

1. Route receives HTTP request and applies middleware
2. Controller parses/validates input and calls a service method
3. Service enforces permissions and business rules
4. Repository performs DB read/write using Drizzle
5. Controller returns response DTO

Data flow is one-way from the route down to the repository. Cross-layer access should not be skipped (for example, controllers should not call repositories directly).

## Required Endpoints (from docs test plan)

Notes:
- The test plan sometimes uses `/list` in examples. Use `/lists` consistently.
- All endpoints require auth and role checks (Owner/Member allowed; Observer forbidden).

### Cards

- POST /cards
  - Use case: create card with body `{ "title": "card title", "listId": "..." }`
  - Permissions:
    - Owner, Member: allowed
    - Observer: 403 Forbidden
  - Validation:
    - `title` is required (not empty)
    - `listId` is required

- PATCH /cards/{card_id}
  - Use cases:
    - Update title: body `{ "title": "New title" }`
    - Assign member: body `{ "userId": "user_id" }`
    - Assign label: body `{ "labelId": "label_id" }`
    - Set due date: body `{ "dueDate": "dd/mm/yyyy" }`
    - Move card to list: body `{ "listId": "list_id" }`
  - Permissions:
    - Owner, Member: allowed
    - Observer: 403 Forbidden
  - Validation:
    - `title` cannot be empty
    - `userId` must exist and be a member of the board
    - Do not add duplicate labels
    - `dueDate` must not be in the past
    - Non-existent `listId` should return 404
    - Non-existent `card_id` should return 404

- DELETE /cards/{card_id}
  - Use case: delete a card
  - Permissions:
    - Owner, Member: allowed
    - Observer: 403 Forbidden
  - Validation:
    - Non-existent `card_id` should return 404

### Lists

- POST /lists
  - Use case: create list with body `{ "name": "list_name" }`
  - Permissions:
    - Owner, Member: allowed
    - Observer: 403 Forbidden
  - Validation:
    - Name required (not empty or only spaces)
    - Name max length 255

- PATCH /lists/{list_id}
  - Use case: rename list with body `{ "name": "new_name" }`
  - Permissions:
    - Owner, Member: allowed
    - Observer: 403 Forbidden
  - Validation:
    - Name required (not empty or only spaces)
    - Name max length 255
    - Not found `list_id` returns 404

- DELETE /lists/{list_id}
  - Use case: delete list
  - Permissions:
    - Owner, Member: allowed
    - Observer: 403 Forbidden
  - Behavior:
    - If list contains cards, delete those cards as well
    - Not found `list_id` returns 404

### Boards

- POST /boards
  - Use case: create a new board with body `{ "name": "board name", "workspaceId": "..." }`
  - Permissions:
    - Authenticated users are allowed
  - Validation:
    - `name` is required
    - `workspaceId` is required

- GET /boards/{board_id}
  - Use case: get board details
  - Permissions:
    - Owner, Member, Observer: allowed (if they are part of the workspace)
  - Validation:
    - Non-existent `board_id` should return 404

- PATCH /boards/{board_id}
  - Use case: update board details with body `{ "name": "new name", "description": "..." }`
  - Permissions:
    - Owner, Member: allowed
    - Observer: 403 Forbidden
  - Validation:
    - `name` cannot be empty
    - Non-existent `board_id` should return 404

- DELETE /boards/{board_id}
  - Use case: delete a board
  - Permissions:
    - Owner: allowed
    - Member, Observer: 403 Forbidden
  - Behavior:
    - Deleting a board should cascade and delete all its lists and cards.
  - Validation:
    - Non-existent `board_id` should return 404

## Intended Service Workflow

This is the target request flow after implementation.

1. HTTP request enters Express app
2. Route maps to a controller and applies auth middleware
3. Controller validates input and delegates to service
4. Service enforces permissions and business rules
5. Repository runs DB operations via Drizzle
6. Response DTO returned to client

## Current Codebase State

- Entry point: index.ts starts Express but does not register routes.
- app.ts is not used by the dev script and imports a wrong config module.
- Routes/controllers/services/repositories are currently empty.
- Schema definitions for boards, lists, cards, labels are present and ready.

## Follow-up Work (Implementation Plan)

- Pick a single entry point (index.ts or app.ts) and register all routes
- Add auth middleware + role guard
- Implement controllers/services/repositories for the endpoints above
- Add error handling and response contracts
