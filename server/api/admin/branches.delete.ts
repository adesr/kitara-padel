import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { dbService } from '../../utils/db'

const deleteBranchSchema = z.object({
  id: z.string().min(1, 'Branch ID is required')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = deleteBranchSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error?.issues[0]?.message || 'Validation error'
    })
  }

  const { id } = result.data
  const success = await dbService.deleteBranch(id)

  if (!success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Branch not found'
    })
  }

  return { success: true }
})
