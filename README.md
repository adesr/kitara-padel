# Kitara Padel Management System

[![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt&logoColor=white)](https://nuxt.com)
[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle-C5F74F?logo=typescript&logoColor=black)](https://orm.drizzle.team/)
[![PNPM](https://img.shields.io/badge/Package_Manager-pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

A state-of-the-art Padel Club & Court Management System built with **Nuxt 4**, **Nuxt UI**, and **Tailwind CSS**, utilizing **Drizzle ORM** for database interaction. It includes branch management, court reservation scheduling (with transaction-level booking collision protection), user tier tracking, and a comprehensive financial ledger with revenue analytics.

---

## 🚀 Key Features

*   **Multi-Branch Support:** Track facilities, addresses, and details for multiple padel clubs.
*   **Court Scheduler:** Dynamic court listing filtered by branch, type (Indoor, Outdoor, Panoramic), and status.
*   **Collision-Free Booking System:** Strict transaction-isolated time overlap checking to prevent double-bookings.
*   **Add-on Services:** Book padel rackets and purchase balls directly during court reservation.
*   **Financial Ledger:** Tracks income (rentals, accessory sales) and expenses (utility, repairs, maintenance).
*   **Analytics Reports:** Summarized reports for total income, expenses, net revenue, and category/daily breakdown charts.
*   **Dual Database Mode:**
    *   **PostgreSQL Production Mode:** Active when a `DATABASE_URL` is configured in environment variables.
    *   **Simulated Local JSON Mode:** Automatically falls back to a simulated JSON-based DB if no database URL is set—complete with realistic pre-seeded data—making it perfect for zero-config offline development.

---

## 🛠️ Technology Stack

*   **Framework:** Nuxt 4 (compatibility mode v4 directory structure)
*   **UI Library:** Nuxt UI & Tailwind CSS v4
*   **Database:** PostgreSQL
*   **ORM:** Drizzle ORM (`drizzle-kit` for schema and migrations management)
*   **Package Manager:** pnpm

---

## 🗄️ Database Architecture

The system utilizes five core relational tables. You can inspect the Drizzle schema in [schema.ts](file:///Users/mcpolri/Documents/code/web/kitara-padel/server/database/schema.ts) or review the PostgreSQL creation scripts in [schema.sql](file:///Users/mcpolri/Documents/code/web/kitara-padel/schema.sql).

### Entity-Relationship Summary:
*   `branches`: Core clubs/facilities.
*   `users`: Club administrators and customers (supports member tiers & roles).
*   `courts`: Belongs to a branch (has types: Indoor, Outdoor, Panoramic).
*   `bookings`: Links a user and a court for a specific time window, recording the booking cost.
*   `finance_ledger`: Records incomes and expenses. Incomes link to `bookings` (with CASCADE and SET NULL protection).

```
 ┌──────────────┐        ┌──────────────┐
 │   branches   │◄───────┤    courts    │
 └──────┬───────┘        └──────┬───────┘
        │                       │
        │                       │ (1-to-many)
        │                       ▼
        │                ┌──────────────┐        ┌──────────────┐
        │                │   bookings   │◄───────┤    users     │
        │                └──────┬───────┘        └──────────────┘
        │                       │
        ▼                       ▼ (Optional 1-to-1/set null)
 ┌──────────────────────────────────────┐
 │            finance_ledger            │
 └──────────────────────────────────────┘
```

---

## 🏁 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   **Node.js** (v18.x or higher)
*   **pnpm** (v9.x or higher)
*   **PostgreSQL** (optional, fallback to local JSON DB if not available)

### 2. Installation
Clone the repository and install all dependencies:
```bash
# Install package dependencies
pnpm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Open `.env` and configure your `DATABASE_URL` for PostgreSQL:
```env
DATABASE_URL="postgres://your_username:your_password@localhost:5432/kitara_padel"
```

---

## 🗃️ Database Setup

You can set up the PostgreSQL database in two ways:

### Option A: Using Drizzle Migrations (Recommended)
This uses Drizzle Kit to automatically compile schemas and apply changes to your PostgreSQL instance:
```bash
# 1. Generate migrations SQL from schema.ts
pnpm exec drizzle-kit generate

# 2. Push/Apply migrations to your PostgreSQL database
pnpm exec drizzle-kit migrate
```

### Option B: Using SQL Script Directly
If you prefer setting up the database tables manually or through direct SQL tools (e.g. pgAdmin, psql CLI), import [schema.sql](file:///Users/mcpolri/Documents/code/web/kitara-padel/schema.sql) into your database:
```bash
psql -U your_username -d kitara_padel -f schema.sql
```

### Option C: Simulated Fallback (Zero Config)
If `DATABASE_URL` is omitted from your `.env` file, the application automatically runs in simulated database mode. It will generate a local database file at `server/database/simulated_db.json` and seed it with realistic sample records (branches, courts, users, and historical booking/ledger records).

---

## 💻 Running the Application

### Development Server
Start the development server with hot module replacement at `http://localhost:3000`:
```bash
pnpm dev
```

### Production Build
To build and optimize the application for production deployment:
```bash
# Build the production server bundle
pnpm build

# Preview the built production output locally
pnpm preview
```

### Additional Commands
*   **Code Linting:** `pnpm lint` (runs ESLint code syntax check)
*   **TypeScript Verification:** `pnpm typecheck` (verifies Vue and TypeScript compiler safety)
*   **Drizzle Studio UI:** `pnpm exec drizzle-kit studio` (starts a web UI to view and edit database rows at `https://local.drizzle.studio`)
