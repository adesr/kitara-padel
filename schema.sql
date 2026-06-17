-- PostgreSQL Database Schema for Kitara Padel Management System
-- Adopted from server/database/schema.ts

-- Enable UUID extension if not already enabled (gen_random_uuid is native in PG 13+)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Branches Table
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer', -- customer, branch_admin, super_admin
    tier VARCHAR(50) NOT NULL DEFAULT 'general' -- general, member
);

-- 3. Courts Table
CREATE TABLE IF NOT EXISTS courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Indoor, Outdoor, Panoramic
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id UUID NOT NULL REFERENCES courts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    final_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed' -- confirmed, cancelled, split_pending
);

-- 5. Finance Ledger Table
CREATE TABLE IF NOT EXISTS finance_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    type VARCHAR(10) NOT NULL, -- INCOME, EXPENSE
    category VARCHAR(100) NOT NULL, -- court_rental, racket_rent, maintenance, utility
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT,
    transaction_date TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_courts_branch_id ON courts(branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_court_id ON bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_finance_ledger_branch_id ON finance_ledger(branch_id);
CREATE INDEX IF NOT EXISTS idx_finance_ledger_booking_id ON finance_ledger(booking_id);
CREATE INDEX IF NOT EXISTS idx_finance_ledger_date ON finance_ledger(transaction_date);

-- 6. Sample Seed Data
-- Insert Branches (using predefined UUIDs for reference capability)
INSERT INTO branches (id, name, address) VALUES
('e05b5ef0-7a8e-4a65-bd29-c89b88939a3b', 'Kitara Padel Arena', '128 Padel Boulevard, Central District'),
('a12e84d9-d8bc-4678-8cf9-1d48b11124fa', 'Kitara Padel Club Beachside', '45 Shoreline Drive, Coastal Hub')
ON CONFLICT (id) DO NOTHING;

-- Insert Users (using predefined UUIDs and unique emails)
INSERT INTO users (id, name, email, role, tier) VALUES
('f3b432a5-48b4-4ec2-9e85-98cf311ba034', 'Admin Manager', 'admin@kitara.com', 'branch_admin', 'general'),
('2c4e69b0-9856-42d8-bf99-880ea89bfa81', 'John Doe', 'john@member.com', 'customer', 'member'),
('7d7301c1-41b1-4c12-9c4c-b16601b67272', 'Jane Smith', 'jane@general.com', 'customer', 'general'),
('3ea5b078-43d9-4824-9b2a-8d341b5b42ab', 'Alex Carter', 'alex@inactive.com', 'customer', 'general'),
('9c0c80b7-f58c-4f7f-8d99-8cb3855ff48d', 'Sarah Connor', 'sarah@member.com', 'customer', 'member')
ON CONFLICT (id) DO NOTHING;

