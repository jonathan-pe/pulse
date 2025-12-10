/**
 * @pulse/shared
 *
 * Shared utilities, constants, and business logic used across API and web applications.
 *
 * Design Philosophy: Future-proof for dynamic configuration
 * - All constants are DEFAULT values that can be overridden
 * - Pure functions with no side effects
 * - Frontend uses for UI display, backend can override with runtime config
 *
 * See README.md for migration path to database-backed configuration.
 */

// Constants - Default business rules
export * from './constants'

// Points - Calculation functions
export * from './points'

// Formatting - Display utilities
export * from './formatting'
