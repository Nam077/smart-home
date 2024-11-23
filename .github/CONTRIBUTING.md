# Contributing to Smart Home Backend

## Welcome!

Thank you for considering contributing to our Smart Home Backend project! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Process](#development-process)
4. [Pull Request Process](#pull-request-process)
5. [Coding Standards](#coding-standards)
6. [Commit Guidelines](#commit-guidelines)
7. [Testing Guidelines](#testing-guidelines)
8. [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/smart-home-backend.git
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/original-owner/smart-home-backend.git
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

## Development Process

1. Create a new branch from `develop`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   
2. Branch naming conventions:
   - `feature/*` for new features
   - `fix/*` for bug fixes
   - `docs/*` for documentation
   - `refactor/*` for code refactoring
   - `test/*` for test additions or modifications

3. Keep your branch updated:
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

## Pull Request Process

1. Update your feature branch with the latest changes from develop
2. Ensure all tests pass
3. Update documentation if necessary
4. Fill out the pull request template completely
5. Request review from maintainers
6. Address review comments and update PR
7. Wait for approval and merge

## Coding Standards

1. Follow TypeScript best practices
2. Use ESLint and Prettier for code formatting
3. Follow NestJS architectural patterns
4. Write clear, self-documenting code
5. Include JSDoc comments for public APIs
6. Keep functions small and focused
7. Use meaningful variable and function names

## Commit Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

## Testing Guidelines

1. Write unit tests for new features
2. Maintain or improve code coverage
3. Include integration tests where necessary
4. Test edge cases and error conditions
5. Use meaningful test descriptions

Example:
```typescript
describe('DeviceService', () => {
  it('should create a new device with valid data', async () => {
    // Test implementation
  });
});
```

## Documentation

1. Update README.md for significant changes
2. Document new features and APIs
3. Include code examples where helpful
4. Update architecture diagrams if needed
5. Document environment variables and configurations

### API Documentation

Use Swagger annotations for API endpoints:

```typescript
@ApiOperation({ summary: 'Create new device' })
@ApiResponse({ status: 201, description: 'Device created successfully' })
@Post()
async create(@Body() createDeviceDto: CreateDeviceDto) {
  // Implementation
}
```

### Code Documentation

Use JSDoc for TypeScript documentation:

```typescript
/**
 * Updates device status and publishes to MQTT
 * @param deviceId - The ID of the device to update
 * @param status - New device status
 * @returns Updated device object
 * @throws DeviceNotFoundException
 */
async updateDeviceStatus(deviceId: string, status: DeviceStatus) {
  // Implementation
}
```

## Questions or Need Help?

Feel free to:
1. Open an issue for questions
2. Join our community chat
3. Contact the maintainers
4. Check existing documentation

Thank you for contributing to Smart Home Backend!
