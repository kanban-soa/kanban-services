# Board Service API Definitions

This document outlines the API endpoints for the Board Service based on the provided test plan.

---

## 1. Board APIs

### `GET /api/boards`
- **Description**: Retrieves all boards for the current user's workspace.
- **Method**: `GET`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Boards retrieved successfully",
    "data": [
      {
        "id": 1,
        "publicId": "pub_12345678",
        "name": "My First Board",
        "slug": "my-first-board",
        "workspaceId": 1,
        "visibility": "private",
        "type": "regular",
        "createdAt": "2026-04-28T10:00:00.000Z"
      }
    ]
  }
  ```

### `POST /api/boards`
- **Description**: Creates a new board.
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "name": "New Project Board",
    "workspaceId": 1,
    "visibility": "private" 
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Board created successfully",
    "data": {
      "id": 2,
      "publicId": "pub_abcdefgh",
      "name": "New Project Board",
      "slug": "new-project-board",
      "workspaceId": 1,
      "visibility": "private",
      "type": "regular",
      "createdAt": "2026-04-28T11:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing `name` or `workspaceId`.
  - `403 Forbidden`: User does not have permission to create a board.

### `PATCH /api/boards/{boardId}`
- **Description**: Updates a board's details (name, description, visibility).
- **Method**: `PATCH`
- **Request Body**:
  ```json
  {
    "name": "Updated Board Name",
    "description": "An updated description."
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Board updated successfully",
    "data": {
      "id": 1,
      "publicId": "pub_12345678",
      "name": "Updated Board Name",
      "description": "An updated description.",
      "..."
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Board with the given `boardId` does not exist.
  - `403 Forbidden`: User does not have permission.

---

## 2. List APIs

### `POST /api/lists`
- **Description**: Creates a new list within a board.
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "name": "To Do",
    "boardId": 1
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "List created successfully",
    "data": {
      "id": 1,
      "publicId": "list_12345",
      "name": "To Do",
      "boardId": 1,
      "index": 0
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing `name` or `boardId`.
  - `403 Forbidden`: User does not have permission.

### `PATCH /api/lists/{listId}`
- **Description**: Renames a list.
- **Method**: `PATCH`
- **Request Body**:
  ```json
  {
    "name": "In Progress"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "List updated successfully",
    "data": {
      "id": 1,
      "name": "In Progress",
      "..."
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: List does not exist.
  - `403 Forbidden`: User does not have permission.
  - `400 Bad Request`: `name` is empty.

### `DELETE /api/lists/{listId}`
- **Description**: Deletes a list and all cards within it.
- **Method**: `DELETE`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "List deleted successfully",
    "data": null
  }
  ```
- **Error Responses**:
  - `404 Not Found`: List does not exist.
  - `403 Forbidden`: User does not have permission.

---

## 3. Card APIs

### `POST /api/cards`
- **Description**: Creates a new card in a list.
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "title": "Implement login feature",
    "listId": 1
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Card created successfully",
    "data": {
      "id": 1,
      "publicId": "card_abcde",
      "title": "Implement login feature",
      "listId": 1,
      "index": 0,
      "..."
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing `title` or `listId`.
  - `403 Forbidden`: User does not have permission.

### `PATCH /api/cards/{cardId}`
- **Description**: Updates a card's details (title, description, listId, dueDate, assigned user, labels).
- **Method**: `PATCH`
- **Request Body Examples**:
  - Update title: `{ "title": "New Card Title" }`
  - Move to another list: `{ "listId": 2 }`
  - Assign user: `{ "assigneeId": "uuid-of-user" }`
  - Add label: `{ "addLabelId": 5 }`
  - Remove label: `{ "removeLabelId": 3 }`
  - Set due date: `{ "dueDate": "2026-12-31T23:59:59.000Z" }`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Card updated successfully",
    "data": {
      "id": 1,
      "title": "New Card Title",
      "..."
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Card, List, User, or Label does not exist.
  - `403 Forbidden`: User does not have permission.
  - `400 Bad Request`: Invalid input (e.g., empty title, invalid date).

### `DELETE /api/cards/{cardId}`
- **Description**: Deletes a card.
- **Method**: `DELETE`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Card deleted successfully",
    "data": null
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Card does not exist.
  - `403 Forbidden`: User does not have permission.
