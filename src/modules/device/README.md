# Device Module

## Overview
The `device` module manages smart home devices within the application. It provides functionality for creating, reading, updating, and deleting devices, as well as managing their relationships with rooms and controllers.

## Structure
- **device.module.ts**: The main module file that imports and provides device-related components.
- **controllers**: Contains controllers that manage device-related requests.
- **dto**: Includes data transfer objects for device creation and updates.
- **entities**: Contains the device entity definition.
- **services**: Offers services that handle device-related business logic.

## API Endpoints

### Create Device
- **Endpoint**: `POST /devices`
- **Description**: Creates a new device
- **Request Body**:
  ```json
  {
    "name": "Living Room Light",
    "type": "ACTUATOR",
    "function": "RELAY",
    "controlPin": "GPIO18",
    "status": false
  }
  ```
- **Responses**:
  - `201 CREATED`: Device created successfully
  - `400 BAD REQUEST`: Invalid input
  - `403 FORBIDDEN`: Permission denied

### Get All Devices
- **Endpoint**: `GET /devices`
- **Description**: Retrieves all devices with pagination
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Responses**:
  - `200 OK`: Devices retrieved successfully
  - `403 FORBIDDEN`: Permission denied

### Get Device by ID
- **Endpoint**: `GET /devices/:id`
- **Description**: Retrieves a specific device by ID
- **Parameters**:
  - `id`: Device UUID
- **Responses**:
  - `200 OK`: Device retrieved successfully
  - `404 NOT FOUND`: Device not found
  - `403 FORBIDDEN`: Permission denied

### Get Devices by Room
- **Endpoint**: `GET /devices/room/:roomId`
- **Description**: Retrieves all devices in a specific room
- **Parameters**:
  - `roomId`: Room UUID
- **Responses**:
  - `200 OK`: Devices retrieved successfully
  - `404 NOT FOUND`: Room not found

### Get Devices by Controller
- **Endpoint**: `GET /devices/controller/:controllerId`
- **Description**: Retrieves all devices managed by a specific controller
- **Parameters**:
  - `controllerId`: Controller UUID
- **Responses**:
  - `200 OK`: Devices retrieved successfully
  - `404 NOT FOUND`: Controller not found

### Update Device
- **Endpoint**: `PATCH /devices/:id`
- **Description**: Updates a specific device
- **Parameters**:
  - `id`: Device UUID
- **Request Body**: Partial device object
  ```json
  {
    "name": "Updated Device Name",
    "status": true
  }
  ```
- **Responses**:
  - `200 OK`: Device updated successfully
  - `400 BAD REQUEST`: Invalid input
  - `404 NOT FOUND`: Device not found
  - `403 FORBIDDEN`: Permission denied

### Soft Delete Device
- **Endpoint**: `DELETE /devices/:id`
- **Description**: Soft deletes a device (marks as inactive)
- **Parameters**:
  - `id`: Device UUID
- **Responses**:
  - `200 OK`: Device deleted successfully
  - `404 NOT FOUND`: Device not found
  - `403 FORBIDDEN`: Permission denied

### Hard Delete Device
- **Endpoint**: `DELETE /devices/:id/hard`
- **Description**: Permanently deletes a device
- **Parameters**:
  - `id`: Device UUID
- **Responses**:
  - `200 OK`: Device permanently deleted
  - `404 NOT FOUND`: Device not found
  - `403 FORBIDDEN`: Permission denied

## Device Types and Functions
### Device Types
- `ACTUATOR`: Devices that can perform actions (e.g., switches, relays)
- `SENSOR`: Devices that collect data (e.g., temperature sensors)

### Device Functions
- `RELAY`: Simple on/off control
- `DIMMER`: Variable intensity control
- `TEMPERATURE`: Temperature measurement
- `HUMIDITY`: Humidity measurement

## Usage Example
```typescript
// Create a new device
const newDevice = await fetch('/devices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    name: 'Living Room Light',
    type: 'ACTUATOR',
    function: 'RELAY',
    controlPin: 'GPIO18'
  })
});

// Update device status
const updateDevice = await fetch('/devices/device_id', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    status: true
  })
});
```

## Security Considerations
- All endpoints require JWT authentication
- Device operations are protected by role-based access control
- Soft delete is preferred over hard delete for data integrity
- Input validation is performed on all requests

## Contribution Guidelines
- Follow the existing naming conventions
- Add appropriate validation rules for new device types
- Include comprehensive test coverage
- Document any new endpoints or device functions
