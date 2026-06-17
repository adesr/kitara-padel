<script setup lang="ts">
import type { User } from '~/../server/utils/db'

const user = useState<User | null>('user', () => null)

onMounted(async () => {
  if (!user.value) {
    try {
      const data = await $fetch<{ user: User }>('/api/auth/me')
      if (data?.user) {
        user.value = data.user
      }
    } catch {
      console.log('User session resolution failed or not logged in')
    }
  }
})
</script>

<template>
  <div class="relative min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-neutral-950 overflow-hidden font-sans">
    <!-- Background blur spots -->
    <div class="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

    <div class="max-w-4xl w-full text-center relative z-10 space-y-8">
      <!-- Logo badge -->
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider animate-bounce">
        <UIcon
          name="i-lucide-award"
          class="w-4 h-4"
        />
        World Class Padel Experience
      </div>

      <!-- Hero Heading -->
      <h1 class="text-4xl sm:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-none">
        Manage Court Bookings & Club Operations
        <span class="block bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-transparent bg-clip-text mt-2 pb-2">
          with Zero Friction.
        </span>
      </h1>

      <p class="max-w-xl mx-auto text-base sm:text-lg text-neutral-500 dark:text-neutral-400">
        Instantly reserve indoor/panoramic courts, configure dynamic seasonal surcharges, manage group CRM broadcasts, and inspect rolling ledger balances.
      </p>

      <!-- CTA Buttons Grid -->
      <div class="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-md mx-auto pt-4">
        <UButton
          to="/bookings"
          label="Booking Calendar"
          icon="i-lucide-calendar"
          size="xl"
          color="success"
          class="w-full sm:w-auto font-bold px-8 shadow-lg shadow-emerald-500/10"
        />

        <UButton
          v-if="user && (user.role === 'branch_admin' || user.role === 'super_admin')"
          to="/admin/branches"
          label="Admin Panel"
          icon="i-lucide-shield-check"
          size="xl"
          color="neutral"
          variant="subtle"
          class="w-full sm:w-auto font-bold px-8 border border-neutral-200 dark:border-neutral-800"
        />

        <UButton
          v-else
          to="/login"
          label="Admin Terminal"
          icon="i-lucide-lock"
          size="xl"
          color="neutral"
          variant="subtle"
          class="w-full sm:w-auto font-bold px-8 border border-neutral-200 dark:border-neutral-800"
        />
      </div>

      <!-- Feature grid cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
        <!-- Feature 1 -->
        <div class="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
            <UIcon
              name="i-lucide-timer"
              class="w-5 h-5"
            />
          </div>
          <h3 class="font-bold text-neutral-900 dark:text-white text-sm">
            Scheduler Grid
          </h3>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Fully reactive, hourly slots scheduler with integrated peak-hour calculations and double-booking transaction protections.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
          <div class="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mb-4">
            <UIcon
              name="i-lucide-badge-percent"
              class="w-5 h-5"
            />
          </div>
          <h3 class="font-bold text-neutral-900 dark:text-white text-sm">
            Split-Billing & Addons
          </h3>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Configure custom racket and ball rental item upgrades that automatically book and push entries into general accounting.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
            <UIcon
              name="i-lucide-dollar-sign"
              class="w-5 h-5"
            />
          </div>
          <h3 class="font-bold text-neutral-900 dark:text-white text-sm">
            Double-Entry Ledger
          </h3>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Automated rollups detailing revenue streams and utility maintenance outlays across 7-day and 30-day metrics.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
