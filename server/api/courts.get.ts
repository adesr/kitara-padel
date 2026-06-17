import { defineEventHandler, getQuery } from 'h3'
import { dbService } from '../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const branchId = query.branchId as string | undefined

  return await dbService.getCourts(branchId)
})
