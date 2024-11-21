# Contributing Guidelines

## Branch Naming Convention

- `main`: Production branch
- `develop`: Development branch
- `feature/*`: New features (e.g., `feature/user-auth`)
- `bugfix/*`: Bug fixes (e.g., `bugfix/login-error`)
- `hotfix/*`: Urgent fixes for production (e.g., `hotfix/security-patch`)
- `release/*`: Release preparation (e.g., `release/v1.0.0`)

## Commit Message Convention

Format: `type(scope): subject`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc)
- `refactor`: Code refactoring
- `test`: Adding missing tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(auth): implement JWT authentication
fix(database): resolve connection timeout issue
docs(api): update API documentation
```

## Pull Request Process

1. Create a new branch from `develop` following the naming convention
2. Make your changes and commit following the commit message convention
3. Update documentation if necessary
4. Ensure all tests pass and linting is clean
5. Create a Pull Request to `develop`
6. Request review from at least one team member
7. Merge after approval

## Development Workflow

1. Create a new branch for your task
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

2. Make changes and commit regularly
```bash
git add .
git commit -m "feat(scope): description"
```

3. Keep your branch updated
```bash
git checkout develop
git pull origin develop
git checkout feature/your-feature-name
git rebase develop
```

4. Push your changes
```bash
git push origin feature/your-feature-name
```

5. Create Pull Request through GitHub interface

## Code Review Guidelines

- Review for:
  - Code quality and style
  - Test coverage
  - Documentation
  - Security concerns
  - Performance implications
  - Architectural consistency

## Release Process

1. Create release branch
```bash
git checkout develop
git checkout -b release/vX.Y.Z
```

2. Version bump and final testing

3. Merge to main and develop
```bash
git checkout main
git merge release/vX.Y.Z
git tag vX.Y.Z
git push origin main --tags

git checkout develop
git merge release/vX.Y.Z
git push origin develop
```
