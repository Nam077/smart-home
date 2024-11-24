# User Module

## Overview
The `user` module manages user accounts within the smart home system. It provides functionality for user registration, authentication, profile management, and user-related operations.

## Structure
- **user.module.ts**: The main module file that imports and provides user-related components.
- **controllers**: Contains controllers that manage user-related requests.
- **dto**: Includes data transfer objects for user creation and updates.
- **entities**: Contains the user entity definition.
- **services**: Offers services that handle user-related business logic.

## API Endpoints

### Create User
- **Endpoint**: `POST /users`
- **Description**: Creates a new user account
- **Authentication**: Bearer Token + Basic Auth required
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "username": "johndoe",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response Body**:
  ```json
  {
    "success": true,
    "data": {
      "id": "9a9a9a9a-9a9a-9a9a-9a9a-9a9a9a9a9a9a",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
  ```
- **Responses**:
  - `201 CREATED`: User created successfully
  - `400 BAD REQUEST`: Invalid input
  - `403 FORBIDDEN`: Permission denied

### Get All Users
- **Endpoint**: `GET /users`
- **Description**: Retrieves all users with pagination
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Responses**:
  - `200 OK`: Users retrieved successfully
  - `403 FORBIDDEN`: Permission denied

### Get User by ID
- **Endpoint**: `GET /users/:id`
- **Description**: Retrieves a specific user by ID
- **Parameters**:
  - `id`: User UUID
- **Responses**:
  - `200 OK`: User retrieved successfully
  - `404 NOT FOUND`: User not found
  - `403 FORBIDDEN`: Permission denied

### Update User
- **Endpoint**: `PATCH /users/:id`
- **Description**: Updates a specific user's information
- **Parameters**:
  - `id`: User UUID
- **Request Body**: Partial user object
  ```json
  {
    "firstName": "Updated First Name",
    "lastName": "Updated Last Name"
  }
  ```
- **Responses**:
  - `200 OK`: User updated successfully
  - `400 BAD REQUEST`: Invalid input
  - `404 NOT FOUND`: User not found
  - `403 FORBIDDEN`: Permission denied

### Delete User
- **Endpoint**: `DELETE /users/:id`
- **Description**: Deletes a user account
- **Parameters**:
  - `id`: User UUID
- **Responses**:
  - `200 OK`: User deleted successfully
  - `404 NOT FOUND`: User not found
  - `403 FORBIDDEN`: Permission denied

## User Properties
- `email`: User's email address (required, unique)
- `username`: User's username (required, unique, min length: 3)
- `password`: User's password (required, min length: 8)
- `firstName`: User's first name (optional)
- `lastName`: User's last name (optional)

## Usage Example
```typescript
// Create a new user
const newUser = await fetch('/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    username: 'johndoe',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe'
  })
});

// Update user profile
const updateUser = await fetch('/users/user_id', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    firstName: 'Updated First Name',
    lastName: 'Updated Last Name'
  })
});
```

## Security Considerations
- Passwords are hashed before storage
- Email verification required for new accounts
- JWT tokens used for authentication
- Role-based access control implemented
- Rate limiting on authentication endpoints
- Password complexity requirements enforced
- Session management and token expiration
- Input validation and sanitization

## Contribution Guidelines
- Follow secure coding practices
- Implement proper error handling
- Add comprehensive test coverage
- Document security implications
- Consider password policy updates
- Maintain backward compatibility
- Follow GDPR compliance guidelines
