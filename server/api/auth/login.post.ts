import { defineEventHandler, readBody, setCookie, createError } from 'h3'
import { z } from 'zod'
import { dbService } from '../../utils/db'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate request body
  const result = loginSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error?.issues[0]?.message || 'Validation error'
    })
  }

  const { email, name } = result.data

  // Find or create user to simulate dynamic login & registration
  let user = await dbService.getUserByEmail(email)
  if (!user) {
    // If logging in for the first time, auto-create a user
    user = await dbService.createUser(
      name || email.split('@')[0] || email,
      email,
      'customer',
      'general'
    )
  }

  // Set secure session cookie (lasts 7 days)
  setCookie(event, 'kitara_session', user.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })

  return {
    success: true,
    user
  }
})
