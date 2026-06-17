import { defineEventHandler, getCookie, createError } from 'h3'
import { dbService } from '../utils/db'

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''

  // Read session cookie
  const sessionEmail = getCookie(event, 'kitara_session')

  if (sessionEmail) {
    try {
      const user = await dbService.getUserByEmail(sessionEmail)
      if (user) {
        event.context.user = user
      }
    } catch (e) {
      console.error('Error resolving user session:', e)
    }
  }

  // Define route protection rules
  const isAdminRoute = url.startsWith('/api/admin') || url.startsWith('/api/v1/admin')
  const isFinanceRoute = url.startsWith('/api/finance') || url.startsWith('/api/v1/finance')

  if (isAdminRoute || isFinanceRoute) {
    if (!event.context.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Session missing or expired'
      })
    }

    const role = event.context.user.role
    if (role !== 'branch_admin' && role !== 'super_admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Admin access required'
      })
    }
  }
})
