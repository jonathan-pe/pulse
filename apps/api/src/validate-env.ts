/**
 * Fail fast when required production configuration is missing.
 *
 * - `PULSE_ENV_FILE_TARGET=production` (e.g. `db:*:prod` scripts): `.env.production` must
 *   stand alone; we only assert vars needed for those commands.
 * - `NODE_ENV=production` (API server): assert a minimal set for a real deployment.
 */

function isNonEmpty(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== ''
}

function missingKeys(entries: Array<[string, string | undefined]>): string[] {
  return entries.filter(([, v]) => !isNonEmpty(v)).map(([k]) => k)
}

/**
 * Call after loading env when `PULSE_ENV_FILE_TARGET=production` (isolated `.env.production`).
 * Ensures Prisma and related CLI commands have what they need.
 */
export function validateEnvForProductionFileTarget(): void {
  if (process.env.PULSE_ENV_FILE_TARGET !== 'production') return

  const missing = missingKeys([['DATABASE_URL', process.env.DATABASE_URL]])
  if (missing.length > 0) {
    throw new Error(
      `[pulse] Missing required variables for production env file: ${missing.join(', ')}. ` +
        `Put a complete set of values in apps/api/.env.production (see apps/api/.env.example).`,
    )
  }
}

/**
 * Call when starting the HTTP server with NODE_ENV=production.
 */
export function validateProductionServerEnv(): void {
  if (process.env.NODE_ENV !== 'production') return

  const missing = missingKeys([
    ['DATABASE_URL', process.env.DATABASE_URL],
    ['CORS_ORIGIN', process.env.CORS_ORIGIN],
  ])
  if (missing.length > 0) {
    throw new Error(
      `[pulse] Missing required production environment variables: ${missing.join(', ')}. ` +
        `Set them in your host (e.g. Vercel) or in apps/api/.env.production for local prod runs.`,
    )
  }
}
