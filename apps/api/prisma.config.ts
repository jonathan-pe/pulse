// prisma.config.ts
import 'dotenv/config' // only needed if you read envs in this file
import path from 'node:path'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Point to the FOLDER that contains your .prisma files
  schema: path.join('prisma', 'schema'),

  // Optional but recommended to be explicit:
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts', // optional
  },

  // Generate Prisma Client to standard location
  generator: {
    output: path.join('node_modules', '.prisma', 'client'),
  },

  // Database connection configuration (Prisma v7)
  datasource: {
    url: env('DATABASE_URL'),
    // Note: directUrl has been removed in Prisma v7
    // Connection pooling is now handled by driver adapters
  },
})
