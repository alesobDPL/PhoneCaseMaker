import { loadEnvFile } from 'node:process'
import { inject } from 'vitest'

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string
  }
}

loadEnvFile('.env.example')
process.env.DATABASE_URL = inject('databaseUrl')
