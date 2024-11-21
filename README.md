# Smart Home Backend

A comprehensive NestJS-based backend system for smart home automation and management.

## Features

- Modular architecture
- Secure authentication and authorization
- Real-time device monitoring
- Automated task scheduling
- Data analytics and reporting

## Technology Stack

- NestJS
- TypeScript
- Better-SQLite3
- TypeORM
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js (v18.x)
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start development server
pnpm run start:dev
```

## Project Structure

```
smart-home-backend/
├── src/
│   ├── config/
│   │   ├── app/
│   │   ├── database/
│   │   ├── jwt/
│   │   └── validation.schema.ts
│   ├── modules/
│   │   └── users/
│   └── main.ts
└── other config files
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
