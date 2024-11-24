# Room Module

## Overview
The `room` module manages rooms within the smart home system. It provides functionality for creating, reading, updating, and deleting rooms, as well as managing their relationships with devices and users.

## Structure
- **room.module.ts**: The main module file that imports and provides room-related components.
- **controllers**: Contains controllers that manage room-related requests.
- **dto**: Includes data transfer objects for room creation and updates.
- **entities**: Contains the room entity definition.
- **services**: Offers services that handle room-related business logic.

## API Endpoints

### Create Room
- **Endpoint**: `POST /rooms`
- **Description**: Creates a new room
- **Request Body**:
  ```json
  {
    "name": "Living Room",
    "description": "Main living room on first floor",
    "floor": 1,
    "area": 30.5,
    "image": "https://example.com/room.jpg",
    "userId": "123e4567-e89b-12d3-a456-426614174000"
  }
  ```
- **Responses**:
  - `201 CREATED`: Room created successfully
  - `400 BAD REQUEST`: Invalid input
  - `403 FORBIDDEN`: Permission denied

### Get All Rooms
- **Endpoint**: `GET /rooms`
- **Description**: Retrieves all rooms with pagination
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Responses**:
  - `200 OK`: Rooms retrieved successfully
  - `403 FORBIDDEN`: Permission denied

### Get Room by ID
- **Endpoint**: `GET /rooms/:id`
- **Description**: Retrieves a specific room by ID
- **Parameters**:
  - `id`: Room UUID
- **Responses**:
  - `200 OK`: Room retrieved successfully
  - `404 NOT FOUND`: Room not found
  - `403 FORBIDDEN`: Permission denied

### Update Room
- **Endpoint**: `PATCH /rooms/:id`
- **Description**: Updates a specific room
- **Parameters**:
  - `id`: Room UUID
- **Request Body**: Partial room object
  ```json
  {
    "name": "Updated Room Name",
    "description": "Updated description"
  }
  ```
- **Responses**:
  - `200 OK`: Room updated successfully
  - `400 BAD REQUEST`: Invalid input
  - `404 NOT FOUND`: Room not found
  - `403 FORBIDDEN`: Permission denied

### Soft Delete Room
- **Endpoint**: `DELETE /rooms/:id`
- **Description**: Soft deletes a room (marks as inactive)
- **Parameters**:
  - `id`: Room UUID
- **Responses**:
  - `200 OK`: Room deleted successfully
  - `404 NOT FOUND`: Room not found
  - `403 FORBIDDEN`: Permission denied

### Hard Delete Room
- **Endpoint**: `DELETE /rooms/:id/hard`
- **Description**: Permanently deletes a room
- **Parameters**:
  - `id`: Room UUID
- **Responses**:
  - `200 OK`: Room permanently deleted
  - `404 NOT FOUND`: Room not found
  - `403 FORBIDDEN`: Permission denied

### Restore Room
- **Endpoint**: `PUT /rooms/:id/restore`
- **Description**: Restores a soft-deleted room
- **Parameters**:
  - `id`: Room UUID
- **Responses**:
  - `200 OK`: Room restored successfully
  - `404 NOT FOUND`: Room not found
  - `403 FORBIDDEN`: Permission denied

## Room Properties
- `name`: Room name (required)
- `description`: Room description (optional)
- `floor`: Floor number (optional)
- `area`: Room area in square meters (optional)
- `image`: URL to room image (optional)
- `userId`: ID of the user who owns the room (required)

## Usage Example
```typescript
// Create a new room
const newRoom = await fetch('/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    name: 'Living Room',
    description: 'Main living room on first floor',
    floor: 1,
    area: 30.5
  })
});

// Update room details
const updateRoom = await fetch('/rooms/room_id', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    name: 'Updated Living Room',
    description: 'Updated description'
  })
});
```

## Security Considerations
- All endpoints require JWT authentication
- Room operations are protected by role-based access control
- Soft delete is preferred over hard delete for data integrity
- Input validation is performed on all requests
- Users can only access rooms they own or have permission to access

## Contribution Guidelines
- Follow the existing naming conventions
- Add appropriate validation rules for new properties
- Include comprehensive test coverage
- Document any new endpoints or room properties
- Consider the impact on related modules (devices, users)
