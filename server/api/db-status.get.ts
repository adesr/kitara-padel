import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { db } from '../database/client'

export default defineEventHandler(async () => {
  if (!db) {
    return { connected: false }
  }
  try {
    await db.execute(sql`SELECT 1`)
    return { connected: true }
  } catch (error) {
    console.error('Database connection test failed:', error)
    return { connected: false }
  }
})
