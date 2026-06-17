import { defineEventHandler, getQuery } from 'h3'
import { dbService } from '../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const courtId = query.courtId as string | undefined
  const userId = query.userId as string | undefined
  const date = query.date as string | undefined

  return await dbService.getBookings({ courtId, userId, date })
})
