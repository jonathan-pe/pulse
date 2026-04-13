import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '@dotenvx/dotenvx'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Root of the `@pulse/api` package (…/apps/api). */
export const apiEnvRoot = resolve(__dirname, '..')

const keysPath = resolve(apiEnvRoot, '.env.keys')

function resolveEnvPaths(): string[] {
  if (process.env.PULSE_ENV_FILE_TARGET === 'production') {
    const prod = resolve(apiEnvRoot, '.env.production')
    return existsSync(prod) ? [prod] : []
  }

  const paths: string[] = []
  const envPath = resolve(apiEnvRoot, '.env')
  const localPath = resolve(apiEnvRoot, '.env.local')
  if (existsSync(envPath)) paths.push(envPath)
  if (existsSync(localPath)) paths.push(localPath)
  return paths
}

const paths = resolveEnvPaths()

if (paths.length > 0) {
  config({
    path: paths,
    envKeysFile: existsSync(keysPath) ? keysPath : undefined,
    ignore: ['MISSING_ENV_FILE'],
  })
}
