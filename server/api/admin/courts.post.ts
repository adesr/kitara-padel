import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { dbService } from '../../utils/db'
import type { Court } from '../../utils/db'

const courtSchema = z.object({
  id: z.string().optional(),
  branchId: z.string().optional(),
  name: z.string().min(2, 'Court name must be at least 2 characters').optional(),
  type: z.string().min(2, 'Court type is required').optional(),
  isActive: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = courtSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error?.issues[0]?.message || 'Validation error'
    })
  }

  const { id, branchId, name, type, isActive } = result.data

  if (id) {
    // Update existing court
    const updates: Partial<Omit<Court, 'id' | 'branchId'>> = {}
    if (name !== undefined) updates.name = name
    if (type !== undefined) updates.type = type
    if (isActive !== undefined) updates.isActive = isActive

    return await dbService.updateCourt(id, updates)
  } else {
    // Create new court
    if (!branchId || !name || !type) {
      throw createError({
        statusCode: 400,
        statusMessage: 'branchId, name, and type are required when creating a court'
      })
    }
    return await dbService.createCourt(branchId, name, type, isActive ?? true)
  }
})
