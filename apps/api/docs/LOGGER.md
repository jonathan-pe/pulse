# Backend Logger

A Winston-based logging solution for the Pulse API with clean formatting, colorization, and extensibility.

## Features

- **Environment-aware formatting**: Human-readable colorized logs in development, structured JSON in production
- **Contextual logging**: Create loggers with context (e.g., router name, service name) for better traceability
- **Type-safe API**: TypeScript interfaces for IDE support
- **Error handling**: Automatic error serialization with stack traces
- **Extensible architecture**: Easy to add transports, formats, and integrations later

## Quick Start

```typescript
import { createLogger, log } from './lib/logger'

// Use the default logger
log.info('Application started')
log.error('Something went wrong', new Error('Database connection failed'))

// Create a contextual logger
const logger = createLogger('UserService')
logger.info('User created', { userId: '123', email: 'user@example.com' })
```

## API Reference

### `createLogger(context?: string): Logger`

Creates a logger instance with optional context.

**Parameters:**

- `context` (optional): A string to identify the logger's context (e.g., 'GamesRouter', 'NatStatClient')

**Returns:** A `Logger` instance with the following methods:

#### `logger.info(message: string, meta?: Record<string, unknown>): void`

Log informational messages (e.g., successful operations, milestones)

```typescript
logger.info('Games fetched successfully', { count: 10, league: 'NBA' })
```

#### `logger.warn(message: string, meta?: Record<string, unknown>): void`

Log warning messages (e.g., recoverable errors, deprecated usage)

```typescript
logger.warn('API rate limit approaching', { current: 95, max: 100 })
```

#### `logger.error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void`

Log error messages with optional Error object

```typescript
logger.error('Database query failed', error, { query: 'SELECT * FROM games' })
```

#### `logger.debug(message: string, meta?: Record<string, unknown>): void`

Log debug information (only visible when LOG_LEVEL=debug)

```typescript
logger.debug('Processing request', { params: { id: '123' } })
```

#### `logger.http(message: string, meta?: Record<string, unknown>): void`

Log HTTP request/response information

```typescript
logger.http('GET /api/games', { method: 'GET', statusCode: 200, duration: 45 })
```

## Configuration

Set via environment variables:

- `LOG_LEVEL`: Controls verbosity (default: `debug` in dev, `info` in production)
  - Levels: `error` < `warn` < `info` < `http` < `debug`
- `NODE_ENV`: Switches between development (colorized) and production (JSON) formats

## Log Levels

Use the appropriate level for each scenario:

| Level | Use Case | Example |
|-------|----------|---------|
| `error` | Errors that require attention | Failed database queries, API errors, unhandled exceptions |
| `warn` | Potential issues or deprecations | Rate limits approaching, deprecated API usage |
| `info` | Important operational milestones | Successful operations, job completions, user actions |
| `http` | HTTP request/response tracking | API calls, endpoint hits, response times |
| `debug` | Detailed diagnostic information | Function parameters, intermediate values, flow control |

## Best Practices

### 1. Use Contextual Loggers

Create a logger per module/component for better traceability:

```typescript
// In routers/games.ts
const logger = createLogger('GamesRouter')

// In integrators/natstat/client.ts
const logger = createLogger('NatStatClient')
```

### 2. Include Relevant Metadata

Add context to help with debugging:

```typescript
logger.info('Game created', {
  gameId: game.id,
  league: game.league,
  homeTeam: game.homeTeam,
  awayTeam: game.awayTeam,
  startsAt: game.startsAt
})
```

### 3. Log Errors Properly

Always pass the Error object as the second parameter:

```typescript
try {
  await someOperation()
} catch (error) {
  logger.error('Operation failed', error, { operation: 'someOperation' })
}
```

### 4. Don't Log Sensitive Data

Never log passwords, API keys, tokens, or PII:

```typescript
// ❌ Bad
logger.debug('User login', { email: 'user@example.com', password: 'secret123' })

// ✅ Good
logger.debug('User login attempt', { userId: user.id, success: true })
```

### 5. Use Appropriate Levels

Don't over-log at high severity levels:

```typescript
// ❌ Bad - using error for non-critical issues
logger.error('User not found', { userId: '123' })

// ✅ Good - warn or info is more appropriate
logger.warn('User not found', { userId: '123' })
```

## Output Formats

### Development (Colorized Console)

```text
2025-10-23 14:32:15 [info]: Games fetched successfully
{
  "count": 10,
  "league": "NBA",
  "context": "GamesRouter"
}
```

### Production (JSON)

```json
{
  "level": "info",
  "message": "Games fetched successfully",
  "timestamp": "2025-10-23T14:32:15.123Z",
  "count": 10,
  "league": "NBA",
  "context": "GamesRouter"
}
```

## Future Enhancements

The logger is architected to easily support:

- **File transports**: Write logs to rotating files
- **External services**: Send logs to Datadog, CloudWatch, Logtail, etc.
- **OpenTelemetry**: Structured trace/span logging
- **Request correlation**: Track requests across services with correlation IDs
- **Performance monitoring**: Automatic timing of operations
- **Log sampling**: Reduce volume in high-traffic scenarios

To add these features later, import and configure the `winstonLogger` export:

```typescript
import { winstonLogger } from './lib/logger'

// Example: Add file transport
winstonLogger.add(new winston.transports.File({ 
  filename: 'logs/error.log', 
  level: 'error' 
}))
```

## Testing

The logger is designed to be test-friendly. In test environments, you can:

1. Set `LOG_LEVEL=error` to reduce noise
2. Mock the logger for unit tests
3. Capture logs for assertion in integration tests

## Examples

See `logger.example.ts` for comprehensive usage examples.
