import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import type { TestProject } from 'vitest/node'

export default async function setup(project: TestProject) {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start()
  const previousDatabaseUrl = process.env.DATABASE_URL
  const databaseUrl = container.getConnectionUri()
  process.env.DATABASE_URL = databaseUrl

  const restoreDatabaseUrl = () => {
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl
    }
  }

  try {
    execFileSync(process.execPath, [
      resolve('node_modules/prisma/build/index.js'), 'migrate', 'deploy',
    ], { env: process.env, stdio: 'inherit' })
    project.provide('databaseUrl', databaseUrl)
  } catch (error) {
    restoreDatabaseUrl()
    await container.stop()
    throw error
  }

  return async () => {
    restoreDatabaseUrl()
    await container.stop()
  }
}
