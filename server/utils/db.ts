import fs from 'node:fs'
import path from 'node:path'
import { eq, and, gte, lte, inArray } from 'drizzle-orm'
import { db, schema } from '../database/client'

// Simulated DB file path (outside app, in server/database)
const SIMULATED_DB_PATH = path.resolve(process.cwd(), 'server/database/simulated_db.json')

// Interface definitions to match Drizzle schemas
export interface Branch {
  id: string
  name: string
  address: string | null
  createdAt: string
}

export interface Court {
  id: string
  branchId: string
  name: string
  type: string
  isActive: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  tier: string
}

export interface Booking {
  id: string
  courtId: string
  userId: string
  startTime: string // ISO string
  endTime: string // ISO string
  finalPrice: string
  status: string
}

export interface FinanceLedger {
  id: string
  branchId: string
  bookingId: string | null
  type: 'INCOME' | 'EXPENSE'
  category: string
  amount: string
  description: string | null
  transactionDate: string
}

interface SimulatedDBData {
  branches: Branch[]
  courts: Court[]
  users: User[]
  bookings: Booking[]
  financeLedger: FinanceLedger[]
}

// Helper to seed simulated database with realistic data relative to current date
function generateSeedData(): SimulatedDBData {
  const now = new Date()

  // Setup standard dates
  const today = (offsetHours: number) => {
    const d = new Date(now)
    d.setHours(offsetHours, 0, 0, 0)
    return d.toISOString()
  }

  const daysAgo = (days: number, offsetHours: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() - days)
    d.setHours(offsetHours, 0, 0, 0)
    return d.toISOString()
  }

  const tomorrow = (offsetHours: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    d.setHours(offsetHours, 0, 0, 0)
    return d.toISOString()
  }

  const sampleBranches: Branch[] = [
    { id: 'b1', name: 'Kitara Padel Arena', address: '128 Padel Boulevard, Central District', createdAt: daysAgo(30, 9) },
    { id: 'b2', name: 'Kitara Padel Club Beachside', address: '45 Shoreline Drive, Coastal Hub', createdAt: daysAgo(30, 9) }
  ]

  const sampleCourts: Court[] = [
    { id: 'c1', branchId: 'b1', name: 'Court 1 - Panoramic Pro', type: 'Panoramic', isActive: true },
    { id: 'c2', branchId: 'b1', name: 'Court 2 - Indoor Standard', type: 'Indoor', isActive: true },
    { id: 'c3', branchId: 'b1', name: 'Court 3 - Outdoor Classic', type: 'Outdoor', isActive: false },
    { id: 'c4', branchId: 'b2', name: 'Court A - Panoramic Beach', type: 'Panoramic', isActive: true },
    { id: 'c5', branchId: 'b2', name: 'Court B - Indoor Aircon', type: 'Indoor', isActive: true }
  ]

  const sampleUsers: User[] = [
    { id: 'u_admin', name: 'Admin Manager', email: 'admin@kitara.com', role: 'branch_admin', tier: 'general' },
    { id: 'u_john', name: 'John Doe', email: 'john@member.com', role: 'customer', tier: 'member' },
    { id: 'u_jane', name: 'Jane Smith', email: 'jane@general.com', role: 'customer', tier: 'general' },
    { id: 'u_alex', name: 'Alex Carter', email: 'alex@inactive.com', role: 'customer', tier: 'general' },
    { id: 'u_sarah', name: 'Sarah Connor', email: 'sarah@member.com', role: 'customer', tier: 'member' }
  ]

  const sampleBookings: Booking[] = [
    // Today bookings
    { id: 'bk1', courtId: 'c1', userId: 'u_john', startTime: today(9), endTime: today(11), finalPrice: '80.00', status: 'confirmed' }, // 9-11 member price (discounted)
    { id: 'bk2', courtId: 'c2', userId: 'u_jane', startTime: today(14), endTime: today(16), finalPrice: '100.00', status: 'confirmed' }, // 14-16 normal price
    // Tomorrow bookings
    { id: 'bk3', courtId: 'c1', userId: 'u_sarah', startTime: tomorrow(18), endTime: tomorrow(20), finalPrice: '110.40', status: 'confirmed' }, // 18-20 member peak price
    { id: 'bk4', courtId: 'c4', userId: 'u_jane', startTime: tomorrow(10), endTime: tomorrow(12), finalPrice: '100.00', status: 'confirmed' }
  ]

  // Financial ledger - seed data covering past 30 days
  const sampleFinanceLedger: FinanceLedger[] = [
    // Income from seeded bookings
    { id: 'f1', branchId: 'b1', bookingId: 'bk1', type: 'INCOME', category: 'court_rental', amount: '80.00', description: 'Reservation BK1 (John Doe)', transactionDate: today(11) },
    { id: 'f2', branchId: 'b1', bookingId: 'bk2', type: 'INCOME', category: 'court_rental', amount: '100.00', description: 'Reservation BK2 (Jane Smith)', transactionDate: today(16) },

    // Add on rental item ledger records (rackets, balls)
    { id: 'f_addon1', branchId: 'b1', bookingId: 'bk1', type: 'INCOME', category: 'racket_rent', amount: '15.00', description: 'Racket rental x3 for BK1', transactionDate: today(11) },

    // Expenses
    { id: 'f_exp1', branchId: 'b1', bookingId: null, type: 'EXPENSE', category: 'maintenance', amount: '150.00', description: 'Court net replacement', transactionDate: daysAgo(5, 12) },
    { id: 'f_exp2', branchId: 'b2', bookingId: null, type: 'EXPENSE', category: 'utility', amount: '320.00', description: 'Monthly air-conditioning service', transactionDate: daysAgo(15, 10) },
    { id: 'f_exp3', branchId: 'b1', bookingId: null, type: 'EXPENSE', category: 'utility', amount: '85.00', description: 'Weekly trash collection service', transactionDate: daysAgo(22, 10) }
  ]

  // Generate historical booking revenue over the last 30 days
  for (let i = 2; i <= 30; i++) {
    // Generate 1-2 random bookings per day
    const dayOffset = i
    const isWeekend = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000).getDay() % 6 === 0
    const baseAmount = isWeekend ? 120.00 : 90.00

    sampleFinanceLedger.push({
      id: `f_hist_inc_${i}`,
      branchId: i % 2 === 0 ? 'b1' : 'b2',
      bookingId: null,
      type: 'INCOME',
      category: 'court_rental',
      amount: baseAmount.toFixed(2),
      description: `Historical Booking Day -${dayOffset}`,
      transactionDate: daysAgo(dayOffset, 12)
    })

    if (i % 5 === 0) {
      // Periodic expenses
      sampleFinanceLedger.push({
        id: `f_hist_exp_${i}`,
        branchId: 'b1',
        bookingId: null,
        type: 'EXPENSE',
        category: i % 10 === 0 ? 'utility' : 'maintenance',
        amount: (45.00 + (i * 3)).toFixed(2),
        description: `Historical Utility/Maintenance -${dayOffset}`,
        transactionDate: daysAgo(dayOffset, 15)
      })
    }
  }

  return {
    branches: sampleBranches,
    courts: sampleCourts,
    users: sampleUsers,
    bookings: sampleBookings,
    financeLedger: sampleFinanceLedger
  }
}

// Read simulated JSON DB
function readSimulatedDB(): SimulatedDBData {
  try {
    if (!fs.existsSync(SIMULATED_DB_PATH)) {
      const parentDir = path.dirname(SIMULATED_DB_PATH)
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true })
      }
      const initialData = generateSeedData()
      fs.writeFileSync(SIMULATED_DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8')
      return initialData
    }
    const content = fs.readFileSync(SIMULATED_DB_PATH, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error reading simulated database file:', error)
    return generateSeedData()
  }
}

// Write simulated JSON DB
function writeSimulatedDB(data: SimulatedDBData) {
  try {
    fs.writeFileSync(SIMULATED_DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing simulated database file:', error)
  }
}

// ----------------------------------------------------
// DATABASE SERVICE LAYER IMPLEMENTATION
// ----------------------------------------------------

export const dbService = {
  // BRANCHES SERVICES
  async getBranches(): Promise<Branch[]> {
    if (db) {
      const results = await db.select().from(schema.branches)
      return results.map(r => ({
        id: r.id,
        name: r.name,
        address: r.address,
        createdAt: r.createdAt.toISOString()
      }))
    } else {
      const data = readSimulatedDB()
      return data.branches
    }
  },

  async createBranch(name: string, address: string | null): Promise<Branch> {
    if (db) {
      const [result] = await db.insert(schema.branches).values({
        name,
        address
      }).returning()
      if (!result) throw new Error('Failed to create branch')
      return {
        id: result.id,
        name: result.name,
        address: result.address,
        createdAt: result.createdAt.toISOString()
      }
    } else {
      const data = readSimulatedDB()
      const newBranch: Branch = {
        id: 'b_' + Math.random().toString(36).substr(2, 9),
        name,
        address,
        createdAt: new Date().toISOString()
      }
      data.branches.push(newBranch)
      writeSimulatedDB(data)
      return newBranch
    }
  },

  async deleteBranch(id: string): Promise<boolean> {
    if (db) {
      const branchCourts = await db.select({ id: schema.courts.id }).from(schema.courts).where(eq(schema.courts.branchId, id))
      const courtIds = branchCourts.map(c => c.id)

      if (courtIds.length > 0) {
        await db.delete(schema.bookings).where(inArray(schema.bookings.courtId, courtIds))
      }

      await db.delete(schema.financeLedger).where(eq(schema.financeLedger.branchId, id))
      await db.delete(schema.courts).where(eq(schema.courts.branchId, id))
      const result = await db.delete(schema.branches).where(eq(schema.branches.id, id)).returning()
      return result.length > 0
    } else {
      const data = readSimulatedDB()
      const branchCourts = data.courts.filter(c => c.branchId === id)
      const courtIds = branchCourts.map(c => c.id)

      data.bookings = data.bookings.filter(b => !courtIds.includes(b.courtId))
      data.financeLedger = data.financeLedger.filter(f => f.branchId !== id)
      data.courts = data.courts.filter(c => c.branchId !== id)

      const initialCount = data.branches.length
      data.branches = data.branches.filter(b => b.id !== id)

      writeSimulatedDB(data)
      return data.branches.length < initialCount
    }
  },

  // COURTS SERVICES
  async getCourts(branchId?: string): Promise<Court[]> {
    if (db) {
      const results = branchId
        ? await db.select().from(schema.courts).where(eq(schema.courts.branchId, branchId))
        : await db.select().from(schema.courts)
      return results.map(r => ({
        id: r.id,
        branchId: r.branchId,
        name: r.name,
        type: r.type,
        isActive: r.isActive
      }))
    } else {
      const data = readSimulatedDB()
      if (branchId) {
        return data.courts.filter(c => c.branchId === branchId)
      }
      return data.courts
    }
  },

  async createCourt(branchId: string, name: string, type: string, isActive: boolean = true): Promise<Court> {
    if (db) {
      const [result] = await db.insert(schema.courts).values({
        branchId,
        name,
        type,
        isActive
      }).returning()
      if (!result) throw new Error('Failed to create court')
      return {
        id: result.id,
        branchId: result.branchId,
        name: result.name,
        type: result.type,
        isActive: result.isActive
      }
    } else {
      const data = readSimulatedDB()
      const newCourt: Court = {
        id: 'c_' + Math.random().toString(36).substr(2, 9),
        branchId,
        name,
        type,
        isActive
      }
      data.courts.push(newCourt)
      writeSimulatedDB(data)
      return newCourt
    }
  },

  async updateCourt(id: string, updates: Partial<Omit<Court, 'id' | 'branchId'>>): Promise<Court> {
    if (db) {
      const results = await db.update(schema.courts)
        .set(updates)
        .where(eq(schema.courts.id, id))
        .returning()
      const result = results[0]
      if (!result) throw new Error('Court not found')
      return {
        id: result.id,
        branchId: result.branchId,
        name: result.name,
        type: result.type,
        isActive: result.isActive
      }
    } else {
      const data = readSimulatedDB()
      const court = data.courts.find(c => c.id === id)
      if (!court) throw new Error('Court not found')

      const updatedCourt: Court = {
        id: court.id,
        branchId: court.branchId,
        name: updates.name !== undefined ? updates.name : court.name,
        type: updates.type !== undefined ? updates.type : court.type,
        isActive: updates.isActive !== undefined ? updates.isActive : court.isActive
      }

      const courtIndex = data.courts.findIndex(c => c.id === id)
      if (courtIndex !== -1) {
        data.courts[courtIndex] = updatedCourt
      }
      writeSimulatedDB(data)
      return updatedCourt
    }
  },

  async deleteCourt(id: string): Promise<boolean> {
    if (db) {
      await db.delete(schema.bookings).where(eq(schema.bookings.courtId, id))
      const result = await db.delete(schema.courts).where(eq(schema.courts.id, id)).returning()
      return result.length > 0
    } else {
      const data = readSimulatedDB()
      const bookingIds = data.bookings.filter(b => b.courtId === id).map(b => b.id)
      data.bookings = data.bookings.filter(b => b.courtId !== id)

      data.financeLedger = data.financeLedger.map((f) => {
        if (f.bookingId && bookingIds.includes(f.bookingId)) {
          return { ...f, bookingId: null }
        }
        return f
      })

      const initialCount = data.courts.length
      data.courts = data.courts.filter(c => c.id !== id)

      writeSimulatedDB(data)
      return data.courts.length < initialCount
    }
  },

  // USERS SERVICES
  async getUsers(role?: string, tier?: string): Promise<User[]> {
    if (db) {
      const conditions = []
      if (role) conditions.push(eq(schema.users.role, role))
      if (tier) conditions.push(eq(schema.users.tier, tier))

      return await (conditions.length > 0
        ? db.select().from(schema.users).where(and(...conditions))
        : db.select().from(schema.users))
    } else {
      const data = readSimulatedDB()
      let filtered = data.users
      if (role) filtered = filtered.filter(u => u.role === role)
      if (tier) filtered = filtered.filter(u => u.tier === tier)
      return filtered
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    if (db) {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)
      return user || null
    } else {
      const data = readSimulatedDB()
      const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase())
      return user || null
    }
  },

  async createUser(name: string, email: string, role: string = 'customer', tier: string = 'general'): Promise<User> {
    if (db) {
      const [result] = await db.insert(schema.users).values({
        name,
        email,
        role,
        tier
      }).returning()
      if (!result) throw new Error('Failed to create user')
      return result
    } else {
      const data = readSimulatedDB()
      const existing = data.users.find(u => u.email.toLowerCase() === email.toLowerCase())
      if (existing) return existing

      const newUser: User = {
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        role,
        tier
      }
      data.users.push(newUser)
      writeSimulatedDB(data)
      return newUser
    }
  },

  // BOOKINGS SERVICES (WITH TRANSACTIONS & OVERLAP PROTECTION)
  async getBookings(filters?: { courtId?: string, userId?: string, date?: string }): Promise<(Booking & { courtName?: string, userName?: string })[]> {
    if (db) {
      // In production PostgreSQL, we would run a joined query.
      // For simplicity, let's load schemas, join tables.
      // Drizzle join implementation:
      const baseQuery = db.select({
        id: schema.bookings.id,
        courtId: schema.bookings.courtId,
        userId: schema.bookings.userId,
        startTime: schema.bookings.startTime,
        endTime: schema.bookings.endTime,
        finalPrice: schema.bookings.finalPrice,
        status: schema.bookings.status,
        courtName: schema.courts.name,
        userName: schema.users.name
      })
        .from(schema.bookings)
        .leftJoin(schema.courts, eq(schema.bookings.courtId, schema.courts.id))
        .leftJoin(schema.users, eq(schema.bookings.userId, schema.users.id))

      const conditions = []
      if (filters?.courtId) conditions.push(eq(schema.bookings.courtId, filters.courtId))
      if (filters?.userId) conditions.push(eq(schema.bookings.userId, filters.userId))

      const results = conditions.length > 0
        ? await baseQuery.where(and(...conditions))
        : await baseQuery
      return results.map(r => ({
        id: r.id,
        courtId: r.courtId,
        userId: r.userId,
        startTime: r.startTime.toISOString(),
        endTime: r.endTime.toISOString(),
        finalPrice: r.finalPrice,
        status: r.status,
        courtName: r.courtName || undefined,
        userName: r.userName || undefined
      }))
    } else {
      const data = readSimulatedDB()
      let list = data.bookings

      if (filters?.courtId) {
        list = list.filter(b => b.courtId === filters.courtId)
      }
      if (filters?.userId) {
        list = list.filter(b => b.userId === filters.userId)
      }
      if (filters?.date) {
        const filterDateStr = new Date(filters.date).toDateString()
        list = list.filter(b => new Date(b.startTime).toDateString() === filterDateStr)
      }

      return list.map((b) => {
        const court = data.courts.find(c => c.id === b.courtId)
        const user = data.users.find(u => u.id === b.userId)
        return {
          ...b,
          courtName: court?.name,
          userName: user?.name
        }
      })
    }
  },

  async createBooking(
    courtId: string,
    userId: string,
    startTimeStr: string,
    endTimeStr: string,
    finalPrice: string,
    status: string = 'confirmed',
    addons: { racketCount: number, ballCount: number } = { racketCount: 0, ballCount: 0 }
  ): Promise<Booking> {
    const start = new Date(startTimeStr)
    const end = new Date(endTimeStr)

    if (start >= end) {
      throw new Error('Start time must be before end time')
    }

    if (db) {
      // Transaction Isolation to prevent race conditions on postgres
      return await db.transaction(async (tx) => {
        // Check overlap: court matches and [start, end] overlaps with other booking's [startTime, endTime]
        // Overlap logic: existing.start < new.end AND existing.end > new.start
        const overlaps = await tx.select()
          .from(schema.bookings)
          .where(
            and(
              eq(schema.bookings.courtId, courtId),
              eq(schema.bookings.status, 'confirmed'),
              // existing.start < end
              lte(schema.bookings.startTime, end),
              // existing.end > start
              gte(schema.bookings.endTime, start)
            )
          )

        if (overlaps.length > 0) {
          throw new Error('Court is already booked during this time slot.')
        }

        // Retrieve user and court to record ledger values
        const [user] = await tx.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1)
        const [court] = await tx.select().from(schema.courts).where(eq(schema.courts.id, courtId)).limit(1)
        if (!user || !court) throw new Error('User or Court not found')

        // Create booking
        const [booking] = await tx.insert(schema.bookings).values({
          courtId,
          userId,
          startTime: start,
          endTime: end,
          finalPrice,
          status
        }).returning()

        if (!booking) throw new Error('Failed to create booking')

        // 1. Log court rental in finance ledger
        await tx.insert(schema.financeLedger).values({
          branchId: court.branchId,
          bookingId: booking.id,
          type: 'INCOME',
          category: 'court_rental',
          amount: finalPrice,
          description: `Court rental for booking ${booking.id} (${user.name})`
        })

        // 2. Log addon racket rental in finance ledger if any
        if (addons.racketCount > 0) {
          const racketFee = (addons.racketCount * 5.00).toFixed(2)
          await tx.insert(schema.financeLedger).values({
            branchId: court.branchId,
            bookingId: booking.id,
            type: 'INCOME',
            category: 'racket_rent',
            amount: racketFee,
            description: `Racket rental x${addons.racketCount} for booking ${booking.id}`
          })
        }

        // 3. Log addon ball rental in finance ledger if any
        if (addons.ballCount > 0) {
          const ballFee = (addons.ballCount * 3.00).toFixed(2)
          await tx.insert(schema.financeLedger).values({
            branchId: court.branchId,
            bookingId: booking.id,
            type: 'INCOME',
            category: 'racket_rent', // categorized with racket_rent or accessory rental
            amount: ballFee,
            description: `Padel ball purchase x${addons.ballCount} for booking ${booking.id}`
          })
        }

        return {
          id: booking.id,
          courtId: booking.courtId,
          userId: booking.userId,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          finalPrice: booking.finalPrice,
          status: booking.status
        }
      })
    } else {
      // In-memory Transaction Isolation
      const data = readSimulatedDB()
      const hasOverlap = data.bookings.some((b) => {
        if (b.courtId !== courtId || b.status !== 'confirmed') return false
        const bStart = new Date(b.startTime)
        const bEnd = new Date(b.endTime)
        return bStart < end && bEnd > start
      })

      if (hasOverlap) {
        throw new Error('Court is already booked during this time slot.')
      }

      const court = data.courts.find(c => c.id === courtId)
      const user = data.users.find(u => u.id === userId)
      if (!court || !user) throw new Error('Court or User not found')

      const newBooking: Booking = {
        id: 'bk_' + Math.random().toString(36).substr(2, 9),
        courtId,
        userId,
        startTime: startTimeStr,
        endTime: endTimeStr,
        finalPrice,
        status
      }
      data.bookings.push(newBooking)

      // Log items to finance ledger
      data.financeLedger.push({
        id: 'f_' + Math.random().toString(36).substr(2, 9),
        branchId: court.branchId,
        bookingId: newBooking.id,
        type: 'INCOME',
        category: 'court_rental',
        amount: finalPrice,
        description: `Court rental for booking ${newBooking.id} (${user.name})`,
        transactionDate: new Date().toISOString()
      })

      if (addons.racketCount > 0) {
        const racketFee = (addons.racketCount * 5.00).toFixed(2)
        data.financeLedger.push({
          id: 'f_' + Math.random().toString(36).substr(2, 9),
          branchId: court.branchId,
          bookingId: newBooking.id,
          type: 'INCOME',
          category: 'racket_rent',
          amount: racketFee,
          description: `Racket rental x${addons.racketCount} for booking ${newBooking.id}`,
          transactionDate: new Date().toISOString()
        })
      }

      if (addons.ballCount > 0) {
        const ballFee = (addons.ballCount * 3.00).toFixed(2)
        data.financeLedger.push({
          id: 'f_' + Math.random().toString(36).substr(2, 9),
          branchId: court.branchId,
          bookingId: newBooking.id,
          type: 'INCOME',
          category: 'racket_rent',
          amount: ballFee,
          description: `Padel ball purchase x${addons.ballCount} for booking ${newBooking.id}`,
          transactionDate: new Date().toISOString()
        })
      }

      writeSimulatedDB(data)
      return newBooking
    }
  },

  // FINANCE SERVICES
  async getFinanceLedger(branchId?: string): Promise<FinanceLedger[]> {
    if (db) {
      const results = branchId
        ? await db.select().from(schema.financeLedger).where(eq(schema.financeLedger.branchId, branchId))
        : await db.select().from(schema.financeLedger)
      return results.map(r => ({
        id: r.id,
        branchId: r.branchId,
        bookingId: r.bookingId,
        type: r.type as 'INCOME' | 'EXPENSE',
        category: r.category,
        amount: r.amount,
        description: r.description,
        transactionDate: r.transactionDate.toISOString()
      }))
    } else {
      const data = readSimulatedDB()
      if (branchId) {
        return data.financeLedger.filter(l => l.branchId === branchId)
      }
      return data.financeLedger
    }
  },

  async createFinanceTransaction(
    branchId: string,
    type: 'INCOME' | 'EXPENSE',
    category: string,
    amount: string,
    description: string | null = null,
    bookingId: string | null = null
  ): Promise<FinanceLedger> {
    if (db) {
      const [result] = await db.insert(schema.financeLedger).values({
        branchId,
        type,
        category,
        amount,
        description,
        bookingId
      }).returning()
      if (!result) throw new Error('Failed to create finance transaction')
      return {
        id: result.id,
        branchId: result.branchId,
        bookingId: result.bookingId,
        type: result.type as 'INCOME' | 'EXPENSE',
        category: result.category,
        amount: result.amount,
        description: result.description,
        transactionDate: result.transactionDate.toISOString()
      }
    } else {
      const data = readSimulatedDB()
      const newTransaction: FinanceLedger = {
        id: 'f_' + Math.random().toString(36).substr(2, 9),
        branchId,
        bookingId,
        type,
        category,
        amount,
        description,
        transactionDate: new Date().toISOString()
      }
      data.financeLedger.push(newTransaction)
      writeSimulatedDB(data)
      return newTransaction
    }
  },

  async getFinanceReport(rangeDays: number = 30): Promise<{
    totalIncome: number
    totalExpense: number
    netRevenue: number
    breakdown: { date: string, income: number, expense: number }[]
    categoryBreakdown: { category: string, amount: number, type: 'INCOME' | 'EXPENSE' }[]
  }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - rangeDays)

    let ledgerEntries: FinanceLedger[]

    if (db) {
      const entries = await db.select()
        .from(schema.financeLedger)
        .where(gte(schema.financeLedger.transactionDate, cutoffDate))
      ledgerEntries = entries.map(r => ({
        id: r.id,
        branchId: r.branchId,
        bookingId: r.bookingId,
        type: r.type as 'INCOME' | 'EXPENSE',
        category: r.category,
        amount: r.amount,
        description: r.description,
        transactionDate: r.transactionDate.toISOString()
      }))
    } else {
      const data = readSimulatedDB()
      ledgerEntries = data.financeLedger.filter(l => new Date(l.transactionDate) >= cutoffDate)
    }

    let totalIncome = 0
    let totalExpense = 0
    const dateMap: Record<string, { income: number, expense: number }> = {}
    const catMap: Record<string, { amount: number, type: 'INCOME' | 'EXPENSE' }> = {}

    // Generate date skeleton for range
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0] || ''
      dateMap[dateStr] = { income: 0, expense: 0 }
    }

    for (const entry of ledgerEntries) {
      const amountVal = parseFloat(entry.amount)
      const dateStr = entry.transactionDate.split('T')[0] || ''

      if (entry.type === 'INCOME') {
        totalIncome += amountVal
        if (dateMap[dateStr]) dateMap[dateStr].income += amountVal
      } else {
        totalExpense += amountVal
        if (dateMap[dateStr]) dateMap[dateStr].expense += amountVal
      }

      const catKey = `${entry.type}:${entry.category}`
      if (!catMap[catKey]) {
        catMap[catKey] = { amount: 0, type: entry.type }
      }
      catMap[catKey].amount += amountVal
    }

    const breakdown = Object.entries(dateMap).map(([date, vals]) => ({
      date,
      income: Math.round(vals.income * 100) / 100,
      expense: Math.round(vals.expense * 100) / 100
    })).sort((a, b) => a.date.localeCompare(b.date))

    const categoryBreakdown = Object.entries(catMap).map(([key, val]) => ({
      category: key.split(':')[1] || '',
      amount: Math.round(val.amount * 100) / 100,
      type: val.type
    }))

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netRevenue: Math.round((totalIncome - totalExpense) * 100) / 100,
      breakdown,
      categoryBreakdown
    }
  }
}
