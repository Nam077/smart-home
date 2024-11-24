# Auth Module

## Overview
The `auth` module handles user authentication and authorization within the application. It includes controllers, data transfer objects (DTOs), guards, services, and strategies related to authentication.

## Structure
- **auth.module.ts**: The main module file that imports and provides authentication-related components.
- **controllers**: Contains controllers that manage authentication-related requests.
- **dto**: Includes data transfer objects for authentication requests and responses.
- **guards**: Provides guards to protect routes and ensure proper authorization.
- **services**: Offers services that handle authentication logic and user validation.
- **strategies**: Implements authentication strategies such as JWT or OAuth.

## API Endpoints

### Login
- **Endpoint**: `POST /auth/login`
- **Description**: Authenticates a user and returns an access token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",    // User's email address
    "password": "password123"       // User's password (min length: 6)
  }
  ```
- **Responses**:
  - `200 OK`: User logged in successfully
    ```json
    {
      "access_token": "jwt_token_here"
    }
    ```
  - `401 UNAUTHORIZED`: Invalid credentials

## Usage
This module is used to authenticate users and manage their access to different parts of the application. It ensures that only authorized users can access protected resources.

### Example Usage
```typescript
// Login request example
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

// Using the access token
const token = (await response.json()).access_token;
// Add token to subsequent requests
headers.Authorization = `Bearer ${token}`;
```

## Security Considerations
- Passwords must be at least 6 characters long
- Email addresses must be valid
- JWT tokens are used for maintaining session state
- All endpoints are protected against brute force attacks

## Contribution
Contributions to the `auth` module should focus on:
- Improving authentication mechanisms
- Adding new authentication strategies
- Enhancing security measures
- Implementing additional validation rules
