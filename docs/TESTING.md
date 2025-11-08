# Testing Guide

This document describes the testing setup and commands available in the Pulse monorepo.

## Test Framework

All packages use [Vitest](https://vitest.dev/) as the testing framework, which provides:
- Fast test execution with watch mode
- TypeScript support out of the box
- Jest-compatible API
- Coverage reporting with v8

## Available Commands

### Root Level Commands

From the repository root, you can run:

```bash
# Run all tests across all packages
pnpm test

# Run tests for specific packages
pnpm test:api
pnpm test:web

# Run tests in watch mode (all packages)
pnpm test:watch

# Run tests with coverage (all packages)
pnpm test:coverage
```

### Package-Specific Commands

Within each package directory (`apps/api`, `apps/web`, `apps/marketing`), you can run:

```bash
# Run tests once
pnpm test

# Run tests in watch mode (re-runs on file changes)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests with UI interface (interactive)
pnpm test:ui
```

## Package Testing Configuration

### API (`apps/api`)

- **Framework**: Vitest with Node environment
- **Test Pattern**: `src/**/__tests__/**/*.{test,spec}.ts`
- **Existing Tests**:
  - `src/services/__tests__/games.service.test.ts`
  - `src/services/__tests__/odds.service.test.ts`
  - `src/services/__tests__/predictions.service.test.ts`
  - `src/integrators/natstat/__tests__/normalize.test.ts`

### Web (`apps/web`)

- **Framework**: Vitest with jsdom environment
- **Test Pattern**: `src/**/__tests__/**/*.{test,spec}.{ts,tsx}`
- **Setup**: `src/__tests__/setup.ts` (includes jsdom polyfills)
- **Example Test**: `src/__tests__/example.test.tsx`

### Marketing (`apps/marketing`)

- **Framework**: Vitest with jsdom environment
- **Test Pattern**: `src/**/__tests__/**/*.{test,spec}.{ts,tsx}`
- **Setup**: `src/__tests__/setup.ts` (includes jsdom polyfills)
- **Example Test**: `src/__tests__/example.test.tsx`

### Database (`packages/db`)

- No tests currently configured (returns success by default)
- Tests can be added in the future for seed scripts or migrations

## Writing Tests

### API Tests (Node Environment)

```typescript
import { describe, it, expect } from 'vitest'

describe('MyService', () => {
  it('should perform an action', () => {
    expect(1 + 1).toBe(2)
  })
})
```

### Frontend Tests (React/jsdom Environment)

```typescript
import { describe, it, expect } from 'vitest'

describe('MyComponent', () => {
  it('should render correctly', () => {
    // Add component tests here using @testing-library/react
    expect(true).toBe(true)
  })
})
```

## Test Organization

Tests should be placed in one of two locations:

1. **Co-located with source files**: `src/components/MyComponent.test.tsx`
2. **In `__tests__` directories**: `src/components/__tests__/MyComponent.test.tsx`

Both patterns are supported and will be discovered by Vitest.

## Coverage Reports

Coverage reports are generated in the `coverage/` directory of each package when running:

```bash
pnpm test:coverage
```

Coverage reports include:
- Text summary in the terminal
- HTML report (`coverage/index.html`)
- JSON report for CI/CD integration

## CI/CD Integration

In CI/CD pipelines, use:

```bash
# Run all tests (fails fast if any test fails)
pnpm test

# Run with coverage for reporting
pnpm test:coverage
```

## Dependencies

Testing-related dependencies are managed at the package level:

- `vitest` - Test runner (workspace root and packages)
- `jsdom` - DOM environment for frontend tests (web/marketing apps)
- `@testing-library/react` - React testing utilities (to be added as needed)
- `@testing-library/jest-dom` - DOM matchers (to be added as needed)

## Notes

- The web and marketing apps require `jsdom` for DOM testing, which is auto-installed on first test run
- API tests use a Node environment and don't require jsdom
- Watch mode is useful during development for instant feedback
- Coverage thresholds can be configured in `vitest.config.ts` files
