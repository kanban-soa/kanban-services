# Kanban Board Service API Documentation

This document provides a detailed specification for the Kanban Board Service API.

**Base URL:** `http://localhost:9003/boards`

## Authentication

All protected endpoints require a `Bearer Token` to be passed in the `Authorization` header.

```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

---

## Boards

Operations related to boards.

### 1. Create a new board

Creates a new board within a specified workspace.

- **Endpoint:** `POST /boards`
- **Permissions:** Requires authentication.
- **Request Body:** `application/json`

| Field         | Type   | Required | Description                   |
|---------------|--------|----------|-------------------------------|
| `name`        | string | Yes      | The name of the new board.    |
| `workspaceId` | string | Yes      | The ID of the workspace.      |

**Example Request:**
```json
{
  "name": "New Project Board",
  "workspaceId": "ws_xyz789"
}
```

- **Responses:**
  - `201 Created`: The board was created successfully.
    ```json
    {
      "id": "brd_123abc",
      "name": "New Project Board",
      "description": null,
      "workspaceId": "ws_xyz789"
    }
    ```
  - `400 Bad Request`: The request body is missing required fields.
  - `401 Unauthorized`: Authentication token is missing or invalid.

### 2. Get board details by ID

Retrieves the details of a specific board.

- **Endpoint:** `GET /boards/{boardId}`
- **Permissions:** Requires authentication. User must be a member of the workspace containing the board.
- **URL Parameters:**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| `boardId` | string | The ID of the board.      |

- **Responses:**
  - `200 OK`: Returns the board object.
    ```json
    {
      "id": "brd_123abc",
      "name": "Project Phoenix",
      "description": "Tracking board for the Phoenix project.",
      "workspaceId": "ws_xyz789"
    }
    ```
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `404 Not Found`: A board with the specified ID was not found.

### 3. Update board details

Updates the name and/or description of a board.

- **Endpoint:** `PATCH /boards/{boardId}`
- **Permissions:** Requires authentication. User must have `Owner` or `Member` role in the workspace.
- **URL Parameters:**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| `boardId` | string | The ID of the board.      |

- **Request Body:** `application/json`

| Field         | Type   | Required | Description                   |
|---------------|--------|----------|-------------------------------|
| `name`        | string | No       | The new name for the board.   |
| `description` | string | No       | The new description.          |

**Example Request:**
```json
{
  "name": "Updated Project Board",
  "description": "New description for the board."
}
```

- **Responses:**
  - `200 OK`: Returns the updated board object.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: User does not have permission to update the board.
  - `404 Not Found`: A board with the specified ID was not found.

### 4. Delete a board

Permanently deletes a board and all of its associated lists and cards.

- **Endpoint:** `DELETE /boards/{boardId}`
- **Permissions:** Requires authentication. User must have the `Owner` role in the workspace.
- **URL Parameters:**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| `boardId` | string | The ID of the board.      |

- **Responses:**
  - `204 No Content`: The board was deleted successfully.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: User does not have permission to delete the board.
  - `404 Not Found`: A board with the specified ID was not found.

---

## Lists

Operations related to lists within a board.

### 1. Create a new list

Creates a new list within a specified board.

- **Endpoint:** `POST /lists`
- **Permissions:** Requires authentication. User must have `Owner` or `Member` role.
- **Request Body:** `application/json`

| Field     | Type   | Required | Description                       |
|-----------|--------|----------|-----------------------------------|
| `name`    | string | Yes      | The name of the new list.         |
| `boardId` | string | Yes      | The ID of the board for this list.|

**Example Request:**
```json
{
  "name": "In Progress",
  "boardId": "brd_123abc"
}
```

- **Responses:**
  - `201 Created`: Returns the newly created list object.
  - `400 Bad Request`: Missing required fields.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: User does not have permission.

### 2. Rename a list

Updates the name of a specific list.

- **Endpoint:** `PATCH /lists/{listId}`
- **Permissions:** Requires authentication. User must have `Owner` or `Member` role.
- **URL Parameters:**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| `listId`  | string | The ID of the list.       |

- **Request Body:** `application/json`

| Field  | Type   | Required | Description               |
|--------|--------|----------|---------------------------|
| `name` | string | Yes      | The new name for the list.|

**Example Request:**
```json
{
  "name": "In Review"
}
```

- **Responses:**
  - `200 OK`: Returns the updated list object.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: User does not have permission.
  - `404 Not Found`: A list with the specified ID was not found.

### 3. Delete a list

Permanently deletes a list and all of its cards.

- **Endpoint:** `DELETE /lists/{listId}`
- **Permissions:** Requires authentication. User must have `Owner` or `Member` role.
- **URL Parameters:**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| `listId`  | string | The ID of the list.       |

- **Responses:**
  - `204 No Content`: The list was deleted successfully.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: User does not have permission.
  - `404 Not Found`: A list with the specified ID was not found.

---

## Cards

Operations related to cards within a list.

### 1. Create a new card

Creates a new card in a specified list.

- **Endpoint:** `POST /cards`
- **Permissions:** Requires authentication. User must have `Owner` or `Member` role.
- **Request Body:** `application/json`

| Field    | Type   | Required | Description                      |
|----------|--------|----------|----------------------------------|
| `title`  | string | Yes      | The title of the new card.       |
| `listId` | string | Yes      | The ID of the list for this card.|

**Example Request:**
```json
{
  "title": "Implement the API endpoint",
  "listId": "lst_456def"
}
```

- **Responses:**
  - `201 Created`: Returns the newly created card object.
  - `400 Bad Request`: Missing required fields.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: User does not have permission.

### 2. Update a card

Updates the details of a specific card. All fields in the request body are optional.

- **Endpoint:** `PATCH /cards/{cardId}`
- **Permissions:** Requires authentication. User must have `Owner` or `Member` role.
- **URL Parameters:**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| `cardId`  | string | The ID of the card.       |

- **Request Body:** `application/json`

| Field         | Type   | Required | Description                               |
|---------------|--------|----------|-------------------------------------------|
| `title`       | string | No       | The new title for the card.               |
| `description` | string | No       | The new description for the card.         |
| `listId`      | string | No       | The ID of the new list to move the card to.|
| `userId`      | string | No       | The ID of the user to assign to the card. |
| `labelId`     | string | No       | The ID of the label to add to the card.   |
| `dueDate`     | string | No       | The new due date (`YYYY-MM-DDTHH:mm:ssZ`).|

**Example Request:**
```json
{
  "title": "Implement and test the API endpoint",
  "description": "Add unit and integration tests."
}
```

- **Responses:**
  - `200 OK`: Returns the updated card object.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: User does not have permission.
  - `404 Not Found`: A card with the specified ID was not found.

### 3. Delete a card

Permanently deletes a card.

- **Endpoint:** `DELETE /cards/{cardId}`
- **Permissions:** Requires authentication. User must have `Owner` or `Member` role.
- **URL Parameters:**

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| `cardId`  | string | The ID of the card.       |

- **Responses:**
  - `204 No Content`: The card was deleted successfully.
  - `401 Unauthorized`: Authentication token is missing or invalid.
  - `403 Forbidden`: User does not have permission.
  - `404 Not Found`: A card with the specified ID was not found.
