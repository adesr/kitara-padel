import { pgTable, uuid, varchar, text, timestamp, boolean, numeric } from 'drizzle-orm/pg-core'

export const branches = pgTable('branches', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const courts = pgTable('courts', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // Indoor, Outdoor, Panoramic
  isActive: boolean('is_active').default(true).notNull()
})

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  role: varchar('role', { length: 50 }).default('customer').notNull(), // customer, branch_admin, super_admin
  tier: varchar('tier', { length: 50 }).default('general').notNull() // general, member
})

export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  courtId: uuid('court_id').references(() => courts.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  finalPrice: numeric('final_price', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('confirmed').notNull() // confirmed, cancelled, split_pending
})

export const financeLedger = pgTable('finance_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 10 }).notNull(), // INCOME, EXPENSE
  category: varchar('category', { length: 100 }).notNull(), // court_rental, racket_rent, maintenance, utility
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  transactionDate: timestamp('transaction_date').defaultNow().notNull()
})
