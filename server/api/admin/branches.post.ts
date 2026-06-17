import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { dbService } from '../../utils/db'

const branchSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = branchSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error?.issues[0]?.message || 'Validation error'
    })
  }

  const { name, address } = result.data
  return await dbService.createBranch(name, address || null)
})
