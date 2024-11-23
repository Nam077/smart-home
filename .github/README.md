# Smart Home Backend

Welcome to the Smart Home Backend project! This project is a comprehensive NestJS-based backend for IoT device control and monitoring.

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [Usage](#usage)
5. [Contributing](#contributing)
6. [License](#license)

## Introduction

The Smart Home Backend provides a robust and scalable solution for managing IoT devices in a smart home environment. It supports real-time communication, device management, and room organization.

## Features

- MQTT communication with Aedes broker
- Real-time device tracking and status updates
- Device and room management
- Secure authentication with JWT
- Modular architecture following NestJS best practices

## Getting Started

### Prerequisites

- Node.js (>=14.x)
- npm (>=6.x)
- PostgreSQL

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/smart-home-backend.git
   cd smart-home-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   - Create a PostgreSQL database
   - Configure database connection in `src/config/database.config.ts`

4. Run the application:
   ```bash
   npm run start:dev
   ```

## Usage

- Access the API documentation at `http://localhost:3000/api`
- Use MQTT clients to connect to the broker and send/receive messages

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
