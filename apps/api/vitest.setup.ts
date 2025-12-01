import { beforeAll } from 'vitest'

beforeAll(() => {
  // Set test environment variables
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.NODE_ENV = 'test'
})
