<script setup lang="ts">
import type { User } from '~/../server/utils/db'

definePageMeta({
  layout: false
})

interface LoginResponse {
  success: boolean
  user: User
}

const email = ref('')
const name = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)

const router = useRouter()
const toast = useToast()
const user = useState<User | null>('user', () => null)

const { data: dbStatus } = await useFetch('/api/db-status')
const isDbConnected = computed(() => dbStatus.value?.connected ?? false)

const handleLogin = async () => {
  errorMsg.value = null
  loading.value = true

  try {
    const response = await $fetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, name: name.value }
    })

    if (response?.success) {
      user.value = response.user
      toast.add({
        title: 'Welcome back!',
        description: `Successfully signed in as ${response.user.name}`,
        color: 'success'
      })

      // Redirect depending on role
      if (response.user.role === 'branch_admin' || response.user.role === 'super_admin') {
        router.push('/admin/branches')
      } else {
        router.push('/bookings')
      }
    }
  } catch (e: unknown) {
    const err = e as { statusMessage?: string, message?: string }
    errorMsg.value = err.statusMessage || err.message || 'Authentication failed. Please verify inputs.'
  } finally {
    loading.value = false
  }
}

// Quick logins for developer testing
const seedLogins = [
  { label: 'Admin (Branch Manager)', email: 'admin@kitara.com', name: 'Admin Manager', icon: 'i-lucide-shield-check', color: 'success' as const },
  { label: 'John Doe (Member)', email: 'john@member.com', name: 'John Doe', icon: 'i-lucide-badge-percent', color: 'primary' as const },
  { label: 'Jane Smith (Regular)', email: 'jane@general.com', name: 'Jane Smith', icon: 'i-lucide-user', color: 'neutral' as const }
]

const handleQuickLogin = (seed: typeof seedLogins[0]) => {
  email.value = seed.email
  name.value = seed.name
  handleLogin()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-radial from-neutral-100 to-neutral-200 dark:from-neutral-900 to-neutral-950 px-4 py-12 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-md w-full space-y-8 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl p-8 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl relative">
      <!-- Accent light glow -->
      <div class="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div class="text-center">
        <h2 class="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-500 to-teal-500 text-transparent bg-clip-text">
          Kitara Padel Club
        </h2>
        <p class="mt-2 text-sm text-neutral-500">
          {{ isDbConnected ? 'Enter credentials to access your account' : 'Enter credentials or choose a test profile below' }}
        </p>
      </div>

      <div
        v-if="errorMsg"
        class="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-2"
      >
        <UIcon
          name="i-lucide-alert-triangle"
          class="w-4 h-4 shrink-0"
        />
        {{ errorMsg }}
      </div>

      <!-- Authentication Form -->
      <form
        class="mt-8 space-y-4"
        @submit.prevent="handleLogin"
      >
        <div class="space-y-3">
          <UFormGroup
            label="Email Address"
            required
          >
            <input
              v-model="email"
              type="email"
              required
              placeholder="e.g. player@example.com"
              class="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
          </UFormGroup>

          <UFormGroup label="Full Name (for new signups)">
            <input
              v-model="name"
              type="text"
              placeholder="e.g. Roger Federer"
              class="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
          </UFormGroup>
        </div>

        <UButton
          type="submit"
          label="Sign In"
          color="success"
          size="lg"
          block
          :loading="loading"
          class="font-semibold shadow-md shadow-emerald-500/10 mt-6"
        />
      </form>

      <!-- Divider & Quick logins (hidden if db connected) -->
      <template v-if="!isDbConnected">
        <!-- Divider -->
        <div class="relative flex py-5 items-center">
          <div class="flex-grow border-t border-neutral-200 dark:border-neutral-800" />
          <span class="flex-shrink mx-4 text-neutral-400 text-xs font-semibold uppercase tracking-wider">Test Accounts</span>
          <div class="flex-grow border-t border-neutral-200 dark:border-neutral-800" />
        </div>

        <!-- Quick logins grid -->
        <div class="grid grid-cols-1 gap-3">
          <UButton
            v-for="seed in seedLogins"
            :key="seed.email"
            :label="seed.label"
            :icon="seed.icon"
            :color="seed.color"
            variant="subtle"
            size="md"
            block
            class="justify-start font-medium"
            @click="handleQuickLogin(seed)"
          />
        </div>
      </template>

      <div class="text-center pt-2">
        <NuxtLink
          to="/"
          class="text-xs font-semibold text-neutral-400 hover:text-emerald-500 transition-colors"
        >
          &larr; Back to Welcome Portal
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
