import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { dbService } from '../../utils/db'

const deleteCourtSchema = z.object({
  id: z.string().min(1, 'Court ID is required')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = deleteCourtSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error?.issues[0]?.message || 'Validation error'
    })
  }

  const { id } = result.data
  const success = await dbService.deleteCourt(id)

  if (!success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Court not found'
    })
  }

  return { success: true }
})
