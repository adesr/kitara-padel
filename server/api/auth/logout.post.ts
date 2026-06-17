import { defineEventHandler, deleteCookie } from 'h3'

export default defineEventHandler((event) => {
  deleteCookie(event, 'kitara_session', {
    path: '/'
  })

  return {
    success: true
  }
})
