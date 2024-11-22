# MQTT Service Flow Diagram

This diagram shows the flow of MQTT service operations including device connections, message handling, and status updates.

```mermaid
graph TD
    A[Start MQTT Service] --> B[Initialize Broker]
    B --> C[Setup Event Handlers]
    C --> D[Start TCP & WebSocket Servers]

    %% Client Connection Flow
    E[Client Connects] --> F{Authenticate Client}
    F -->|Success| G[Update Device Connection]
    F -->|Failure| H[Return Auth Error]
    G --> I[Publish Initial Status]
    I -->|If Connected & Has Status| J[Send Last Control Command]

    %% Message Handling Flow
    K[Receive Message] --> L{Check Topic Type}
    L -->|status| M[Handle Device Status]
    L -->|data| N[Handle Device Data]
    L -->|control| O[Handle Device Control]

    %% Control Commands Flow
    O --> P{Check Command Type}
    P -->|get_status| Q[Notify Device Status]
    P -->|set_status| R[Update Status]
    P -->|set_value| S[Update Value]
    P -->|set_brightness| T[Update Brightness]
    P -->|set_temperature| U[Update Temperature]
    
    %% Status Update Flow
    R & S & T & U --> V[Save Device]
    V --> W[Notify Status Change]
    W --> X[Publish to Status Topic]

    %% Device Status Notification
    Q --> Y[Get Current Device]
    Y --> Z[Create Status Object]
    Z --> AA[Publish Status]

    %% Connection Status
    AB[Client Disconnects] --> AC[Update Connection Status]
    AC --> AD[Set Device Offline]
    AD --> AE[Publish Status Update]
```

## Flow Description

1. **Service Initialization**
   - Initialize MQTT broker
   - Setup event handlers
   - Start TCP and WebSocket servers

2. **Client Connection Flow**
   - Client connects
   - Authenticate client credentials
   - Update device connection status
   - Send initial status and last control command

3. **Message Handling**
   - Receive message on topic
   - Parse message type (status/data/control)
   - Route to appropriate handler

4. **Control Commands**
   - get_status: Fetch and notify current status
   - set_status: Update device power state
   - set_value: Update device value
   - set_brightness: Update device brightness
   - set_temperature: Update device temperature

5. **Status Updates**
   - Save device changes
   - Notify status changes
   - Publish to status topic

6. **Device Status Notification**
   - Get current device state
   - Create status object with all fields
   - Publish to device status topic

7. **Disconnection Flow**
   - Client disconnects
   - Update connection status
   - Set device offline
   - Publish status update

## MQTT Topics

All communication happens through MQTT topics in the format:
- `device/{deviceId}/status`: For device status updates
- `device/{deviceId}/data`: For device data updates
- `device/{deviceId}/control`: For control commands
