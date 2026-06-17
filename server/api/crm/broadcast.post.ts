import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { dbService } from '../../utils/db'

const broadcastSchema = z.object({
  segment: z.enum(['members', 'regulars', 'all']),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters')
})

export default defineEventHandler(async (event) => {
  // Check auth manually if middleware is prefix-based (to be extra secure)
  const user = event.context.user
  if (!user || (user.role !== 'branch_admin' && user.role !== 'super_admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Admin clearance required'
    })
  }

  const body = await readBody(event)

  const result = broadcastSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error?.issues[0]?.message || 'Validation error'
    })
  }

  const { segment, subject, message } = result.data

  // 1. Fetch user records
  const allUsers = await dbService.getUsers()
  const customers = allUsers.filter(u => u.role === 'customer')

  const targetUsers = segment === 'members'
    ? customers.filter(c => c.tier === 'member')
    : segment === 'regulars'
      ? customers.filter(c => c.tier === 'general')
      : customers

  // 2. Simulate email dispatch
  const dispatchedList = targetUsers.map(u => ({
    userId: u.id,
    name: u.name,
    email: u.email,
    status: 'delivered'
  }))

  // Log in ledger or print
  console.log(`[CRM BROADCAST] Sent "${subject}" (Message length: ${message.length}) to ${dispatchedList.length} users in segment "${segment}"`)

  return {
    success: true,
    campaign: {
      segment,
      subject,
      recipientCount: dispatchedList.length,
      timestamp: new Date().toISOString()
    },
    recipients: dispatchedList
  }
})
