import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { dbService } from '../utils/db'
import { calculatePricing } from '../utils/pricing'

const createBookingSchema = z.object({
  courtId: z.string().min(1, 'Court is required'),
  userId: z.string().min(1, 'User is required'),
  startTime: z.string().datetime({ message: 'Invalid start time date format' }),
  endTime: z.string().datetime({ message: 'Invalid end time date format' }),
  racketCount: z.number().min(0).default(0),
  ballCount: z.number().min(0).default(0)
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = createBookingSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error?.issues[0]?.message || 'Validation error'
    })
  }

  const { courtId, userId, startTime, endTime, racketCount, ballCount } = result.data

  try {
    // 1. Fetch user to check their membership tier
    const usersList = await dbService.getUsers()
    const user = usersList.find(u => u.id === userId)
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Selected user not found'
      })
    }

    // 2. Fetch court to verify existence and active status
    const courtsList = await dbService.getCourts()
    const court = courtsList.find(c => c.id === courtId)
    if (!court) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Selected court not found'
      })
    }
    if (!court.isActive) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Selected court is currently inactive'
      })
    }

    // 3. Compute final price based on user tier and addons
    const pricing = calculatePricing(startTime, endTime, user.tier, { racketCount, ballCount })

    // 4. Create the booking with overlapping checks and database locks inside transaction
    const booking = await dbService.createBooking(
      courtId,
      userId,
      startTime,
      endTime,
      pricing.courtPrice.toFixed(2),
      'confirmed',
      { racketCount, ballCount }
    )

    return {
      success: true,
      booking,
      pricing
    }
  } catch (error: unknown) {
    const err = error as { statusCode?: number, message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.message || 'Failed to process reservation'
    })
  }
})
