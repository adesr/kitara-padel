import { defineEventHandler } from 'h3'
import { dbService } from '../utils/db'

export default defineEventHandler(async () => {
  return await dbService.getUsers()
})
