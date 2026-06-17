import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  // Return the user if authenticated by the middleware, or null
  return {
    user: event.context.user || null
  }
})
