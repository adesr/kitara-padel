<script setup lang="ts">
import type { Branch, User } from '~/../server/utils/db'

const branches = ref<Branch[]>([])
const selectedBranchId = ref('')
const loading = ref(true)

const user = useState<User | null>('user', () => null)
const toast = useToast()

// Fetch branches on mount
onMounted(async () => {
  try {
    // Check session first
    if (!user.value) {
      const data = await $fetch<{ user: User }>('/api/auth/me')
      if (data?.user) {
        user.value = data.user
      }
    }

    const branchesData = await $fetch<Branch[]>('/api/branches')
    branches.value = branchesData

    // Select first branch by default
    if (branchesData.length > 0) {
      selectedBranchId.value = branchesData[0]?.id || ''
    }
  } catch {
    toast.add({
      title: 'Loading failed',
      description: 'Unable to retrieve court facility branch list.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
})

// Calculate current branch info
const activeBranch = computed(() => {
  return branches.value.find(b => b.id === selectedBranchId.value) || null
})

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    toast.add({
      title: 'Logged Out',
      description: 'You are now browsing as guest.',
      color: 'neutral'
    })
  } catch (e) {
    console.error('Logout error', e)
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
    <!-- User state banner / Guest header -->
    <div class="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 p-6 rounded-2xl shadow-sm">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
          <UIcon
            name="i-lucide-calendar"
            class="w-6 h-6"
          />
        </div>
        <div>
          <h1 class="text-2xl font-black text-neutral-900 dark:text-white">
            Padel Court Bookings
          </h1>
          <p class="text-xs text-neutral-500 mt-1">
            Select a club location to view live court availability
          </p>
        </div>
      </div>

      <!-- Authentication indicator / actions -->
      <div class="flex items-center gap-3">
        <div
          v-if="user"
          class="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-950 px-4 py-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-500" />
          <div class="text-xs">
            <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ user.name }}</span>
            <span class="text-neutral-400 capitalize ml-1 font-medium">({{ user.tier }})</span>
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
        <div
          v-else
          class="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl"
        >
          <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span class="text-xs text-amber-600 dark:text-amber-500 font-semibold">Browsing as Guest</span>
          <UButton
            to="/login"
            label="Sign In to Book"
            size="sm"
            color="success"
            class="font-bold ml-2 shadow-sm"
          />
        </div>

        <UButton
          v-if="user && (user.role === 'branch_admin' || user.role === 'super_admin')"
          to="/admin/branches"
          label="Admin Dashboard"
          icon="i-lucide-shield-check"
          color="neutral"
          variant="outline"
          size="sm"
          class="font-bold border-neutral-200 dark:border-neutral-800"
        />
      </div>
    </div>

    <!-- Branch Selection Grid -->
    <div
      v-if="branches.length > 0"
      class="grid grid-cols-1 lg:grid-cols-4 gap-8"
    >
      <div class="lg:col-span-1 space-y-4">
        <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-400">
          Club Locations
        </h3>

        <div class="flex flex-col gap-2">
          <button
            v-for="b in branches"
            :key="b.id"
            class="w-full text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-1"
            :class="[
              selectedBranchId === b.id
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-300 shadow-sm'
                : 'bg-white dark:bg-neutral-900 border-neutral-200/50 dark:border-neutral-800/50 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700'
            ]"
            @click="selectedBranchId = b.id"
          >
            <span class="font-bold text-sm">{{ b.name }}</span>
            <span class="text-[11px] text-neutral-400 font-normal truncate mt-1 flex items-center gap-1">
              <UIcon
                name="i-lucide-map-pin"
                class="shrink-0"
              />
              {{ b.address || 'Address not listed' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Court Scheduler View -->
      <div class="lg:col-span-3 space-y-6">
        <div
          v-if="activeBranch"
          class="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 rounded-2xl p-6 flex flex-col gap-1"
        >
          <span class="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">Active Facility</span>
          <h2 class="text-lg font-black text-neutral-800 dark:text-neutral-100">
            {{ activeBranch.name }}
          </h2>
          <p class="text-xs text-neutral-500 mt-1 flex items-center gap-1">
            <UIcon
              name="i-lucide-map-pin"
              class="text-neutral-400 w-3.5 h-3.5"
            />
            {{ activeBranch.address }}
          </p>
        </div>

        <CourtScheduler
          v-if="selectedBranchId"
          :branch-id="selectedBranchId"
          :is-admin-view="user?.role === 'branch_admin' || user?.role === 'super_admin'"
        />
      </div>
    </div>

    <!-- Empty/Loading state -->
    <div
      v-else-if="loading"
      class="flex flex-col items-center justify-center py-20"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 text-emerald-500 animate-spin"
      />
      <p class="text-sm text-neutral-500 mt-2">
        Connecting to club locations...
      </p>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl py-20 px-4 text-center"
    >
      <UIcon
        name="i-lucide-building-2"
        class="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-3"
      />
      <h3 class="font-bold text-neutral-800 dark:text-neutral-200">
        No Branches Available
      </h3>
      <p class="text-sm text-neutral-500 mt-1 max-w-sm">
        Please log in as an administrator to create your first club branch and add courts.
      </p>
      <UButton
        to="/login"
        label="Log In as Admin"
        color="success"
        class="mt-4 font-bold shadow-sm"
      />
    </div>
  </div>
</template>
