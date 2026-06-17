import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { dbService } from '../../utils/db'

const transactionSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(2, 'Category is required'),
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Amount must be a positive number'),
  description: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = transactionSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error?.issues[0]?.message || 'Validation error'
    })
  }

  const { branchId, type, category, amount, description } = result.data

  return await dbService.createFinanceTransaction(
    branchId,
    type,
    category,
    amount,
    description || null
  )
})
