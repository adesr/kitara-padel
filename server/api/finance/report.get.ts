import { defineEventHandler, getQuery } from 'h3'
import { dbService } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const range = query.range ? parseInt(query.range as string, 10) : 30

  return await dbService.getFinanceReport(range)
})
