# Testing Documentation

This directory contains all the test files for the Unlad Template API project. We use Jest as our testing framework along with TypeScript support.

## Table of Contents

- [Setup](#setup)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Linting and Code Quality](#linting-and-code-quality)
- [Git Hooks](#git-hooks)
- [Continuous Integration](#continuous-integration)

## Setup

The project uses the following testing-related dependencies:

- Jest: Testing framework
- TypeScript: For type checking
- ESLint: For code quality
- Prettier: For code formatting
- Husky: For Git hooks

## Test Structure

Tests are organized following the service/component structure of the main application:

```
__tests__/
├── userService.test.ts   # Tests for user service
├── personService.test.ts # Tests for person service
└── ...
```

Each test file follows these conventions:

- Named as `*.test.ts`
- Imports the service/component being tested
- Uses Jest's `describe` and `test` blocks
- Includes both success and error cases

Example test structure:

```typescript
describe("Service Name", () => {
  describe("functionName", () => {
    test("should do something when condition", async () => {
      // Test implementation
    });

    test("should handle error when condition", async () => {
      // Error handling test
    });
  });
});
```

## Running Tests

Available test commands:

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- userService.test.ts

# Run tests matching specific pattern
npm test -- -t "user service"
```

## Linting and Code Quality

We use ESLint with TypeScript support and Prettier for code formatting.

### Available Commands

```bash
# Check linting issues
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check TypeScript types
npm run check-types

# Run all checks (lint, types, and tests)
npm run validate
```

### ESLint Configuration

Key linting rules:

- No unused variables
- No explicit `any` types (warning)
- Consistent code style
- Proper TypeScript usage

To ignore specific lines from linting:

```typescript
// eslint-disable-next-line rule-name
const something = foo();
```

## Git Hooks

We use Husky to enforce code quality checks before commits.

### Pre-commit Hook

The pre-commit hook runs automatically before each commit and:

1. Runs linting checks
2. Checks TypeScript types
3. Runs tests

If any of these checks fail, the commit will be blocked.

### Manual Hook Bypass

In case you need to bypass hooks (not recommended):

```bash
git commit -m "message" --no-verify
```

### Hook Configuration

Hooks are configured in the `.husky` directory:

```bash
.husky/
├── pre-commit  # Runs before commit
└── ...
```

## Continuous Integration

For each pull request and push to main branch:

1. All tests must pass
2. No linting errors
3. TypeScript compilation must succeed

### Best Practices

1. **Write Tests First**: Follow TDD when possible
2. **Mock External Dependencies**: Use Jest's mocking capabilities
3. **Test Edge Cases**: Include error scenarios
4. **Keep Tests Focused**: One assertion per test when possible
5. **Use Descriptive Names**: Clear test and describe block names

### Example Test

```typescript
import { describe, expect, test } from "@jest/globals";
import userService from "../services/userService";

describe("User Service", () => {
  test("should throw error when getting user without ID", async () => {
    await expect(userService.getUser("", {})).rejects.toThrow(config.ERROR.USER.NO_ID);
  });

  test("should create user successfully", async () => {
    const mockUser = {
      email: "test@example.com",
      password: "password123",
    };
    const result = await userService.createUser(mockUser);
    expect(result).toBeDefined();
    expect(result.email).toBe(mockUser.email);
  });
});
```

## Troubleshooting

Common issues and solutions:

1. **Tests Failing Due to TypeScript Errors**

   ```bash
   npm run check-types
   ```

2. **Linting Errors**

   ```bash
   npm run lint:fix
   ```

3. **Git Hooks Not Running**

   ```bash
   npm run prepare
   ```

4. **Test Watch Mode Not Working**
   ```bash
   npm test -- --watch
   ```

For more help, check:

- Jest documentation: https://jestjs.io/docs/getting-started
- ESLint documentation: https://eslint.org/docs/user-guide/getting-started
- Husky documentation: https://typicode.github.io/husky/
