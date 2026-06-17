import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null

if (process.env.DATABASE_URL) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  })

  dbInstance = drizzle(pool, { schema })
}

export const db = dbInstance
export { schema }
export type Database = typeof db
