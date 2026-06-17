<script setup lang="ts">
import type { User } from '~/../server/utils/db'

const router = useRouter()
const route = useRoute()

// User state and auth check
const user = useState<User | null>('user', () => null)

// Fetch current user if not loaded
onMounted(async () => {
  if (!user.value) {
    try {
      const data = await $fetch<{ user: User }>('/api/auth/me')
      if (data?.user) {
        user.value = data.user
        // Verify admin permissions
        if (user.value.role !== 'branch_admin' && user.value.role !== 'super_admin') {
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    } catch {
      router.push('/login')
    }
  }
})

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    router.push('/login')
  } catch (e) {
    console.error('Logout error', e)
  }
}

const navigationLinks = [
  { label: 'Booking Calendar', to: '/bookings', icon: 'i-lucide-calendar' },
  { label: 'Branches', to: '/admin/branches', icon: 'i-lucide-building-2' },
  { label: 'Courts Inventory', to: '/admin/courts', icon: 'i-lucide-layout-grid' },
  { label: 'Financial Ledger', to: '/admin/finance', icon: 'i-lucide-dollar-sign' },
  { label: 'CRM Broadcast', to: '/admin/crm', icon: 'i-lucide-users' }
]

const mobileMenuOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans antialiased text-neutral-900 dark:text-neutral-50">
    <!-- Header (Glassmorphism layout) -->
    <header class="sticky top-0 z-40 w-full border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md">
      <div class="px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Mobile menu trigger -->
          <UButton
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            class="lg:hidden"
            @click="mobileMenuOpen = !mobileMenuOpen"
          />
          <NuxtLink
            to="/"
            class="flex items-center gap-2 font-bold text-xl tracking-tight text-neutral-900 dark:text-white"
          >
            <span class="bg-gradient-to-r from-emerald-500 to-teal-500 text-transparent bg-clip-text">Kitara</span>
            <span class="text-xs uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">Admin</span>
          </NuxtLink>
        </div>

        <div class="flex items-center gap-4">
          <UColorModeButton />

          <div
            v-if="user"
            class="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-950 px-4 py-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500" />
            <div class="text-xs">
              <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ user.name }}</span>
              <span class="text-neutral-400 capitalize ml-1 font-medium">({{ user.role }})</span>
            </div>
            <UButton
              label="Sign Out"
              size="xs"
              color="neutral"
              variant="ghost"
              class="ml-2 font-semibold"
              @click="handleLogout"
            />
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Desktop Sidebar -->
      <aside class="hidden lg:block w-64 shrink-0 border-r border-neutral-200/50 dark:border-neutral-800/50 min-h-[calc(100vh-4rem)] p-4 bg-white/50 dark:bg-neutral-900/50">
        <nav class="space-y-1.5">
          <NuxtLink
            v-for="link in navigationLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            :class="[
              route.path === link.to
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-500'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white'
            ]"
          >
            <UIcon
              :name="link.icon"
              class="w-5 h-5 shrink-0"
            />
            {{ link.label }}
          </NuxtLink>
        </nav>
      </aside>

      <!-- Mobile drawer (Simulated dialog overlay) -->
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-50 flex lg:hidden bg-neutral-900/80 backdrop-blur-sm"
        @click="mobileMenuOpen = false"
      >
        <div
          class="w-64 max-w-xs bg-white dark:bg-neutral-950 p-6 flex flex-col h-full border-r border-neutral-200 dark:border-neutral-800"
          @click.stop
        >
          <div class="flex items-center justify-between mb-8">
            <span class="font-bold text-lg text-emerald-500">Kitara Admin</span>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              @click="mobileMenuOpen = false"
            />
          </div>
          <nav class="space-y-2 flex-1">
            <NuxtLink
              v-for="link in navigationLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              :class="[
                route.path === link.to
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-500'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
              ]"
              @click="mobileMenuOpen = false"
            >
              <UIcon
                :name="link.icon"
                class="w-5 h-5 shrink-0"
              />
              {{ link.label }}
            </NuxtLink>
          </nav>
          <div
            v-if="user"
            class="border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-auto"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-sm">
                {{ user?.name?.[0]?.toUpperCase() }}
              </div>
              <div>
                <p class="font-semibold text-xs leading-none">
                  {{ user.name }}
                </p>
                <p class="text-[10px] text-neutral-500 mt-1">
                  {{ user.email }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main workspace -->
      <main class="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
