<script setup lang="ts">
import type { User } from '~/../server/utils/db'

definePageMeta({
  layout: 'admin'
})

interface BroadcastResult {
  success: boolean
  campaign: {
    segment: string
    subject: string
    recipientCount: number
    timestamp: string
  }
}

const activeSegment = ref<'members' | 'regulars' | 'all'>('members')
const subject = ref('')
const message = ref('')
const loading = ref(false)
const submitting = ref(false)
const users = ref<User[]>([])
const toast = useToast()

const formErrors = ref<string | null>(null)
const dispatchResult = ref<BroadcastResult | null>(null)

const fetchUsers = async () => {
  loading.value = true
  try {
    const data = await $fetch<User[]>('/api/users')
    users.value = data.filter(u => u.role === 'customer')
  } catch (e) {
    console.error('Failed to load users list', e)
  } finally {
    loading.value = false
  }
}

const activeRecipients = computed(() => {
  if (activeSegment.value === 'members') {
    return users.value.filter(u => u.tier === 'member')
  } else if (activeSegment.value === 'regulars') {
    return users.value.filter(u => u.tier === 'general')
  }
  return users.value
})

const handleSendBroadcast = async () => {
  formErrors.value = null
  dispatchResult.value = null
  submitting.value = true

  try {
    const response = await $fetch<BroadcastResult>('/api/crm/broadcast', {
      method: 'POST',
      body: {
        segment: activeSegment.value,
        subject: subject.value,
        message: message.value
      }
    })

    if (response.success) {
      toast.add({
        title: 'Campaign Dispatched!',
        description: `Successfully broadcasted to ${response.campaign.recipientCount} clients.`,
        color: 'success'
      })

      dispatchResult.value = response
      // Clear message inputs
      subject.value = ''
      message.value = ''
    }
  } catch (e: unknown) {
    const err = e as { statusMessage?: string, message?: string }
    formErrors.value = err.statusMessage || err.message || 'Unable to dispatch campaign. Verify inputs.'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="space-y-8 max-w-5xl mx-auto font-sans">
    <!-- Header banner -->
    <div class="flex items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 p-6 rounded-2xl shadow-sm">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
        <UIcon
          name="i-lucide-users"
          class="w-6 h-6"
        />
      </div>
      <div>
        <h1 class="text-2xl font-black text-neutral-900 dark:text-white">
          CRM Broadcasts
        </h1>
        <p class="text-xs text-neutral-500 mt-1">
          Design promotional campaigns and dispatch segments of your member network
        </p>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <!-- Composer form -->
      <div class="lg:col-span-3 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm h-fit">
        <h3 class="font-bold text-base text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
          <UIcon
            name="i-lucide-send"
            class="text-emerald-500"
          />
          Campaign Composer
        </h3>

        <p
          v-if="formErrors"
          class="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg mb-4 flex items-center gap-2"
        >
          <UIcon
            name="i-lucide-alert-triangle"
            class="w-4 h-4 shrink-0"
          />
          {{ formErrors }}
        </p>

        <form
          class="space-y-5"
          @submit.prevent="handleSendBroadcast"
        >
          <!-- Segment Select -->
          <UFormGroup
            label="Recipient Cohort"
            required
          >
            <div class="grid grid-cols-3 gap-2 p-1 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50">
              <button
                type="button"
                class="py-2 text-xs font-bold rounded-lg transition-all"
                :class="[activeSegment === 'members' ? 'bg-white dark:bg-neutral-900 text-emerald-500 shadow-sm border border-neutral-200/50 dark:border-neutral-800/50' : 'text-neutral-400']"
                @click="activeSegment = 'members'"
              >
                Members
              </button>
              <button
                type="button"
                class="py-2 text-xs font-bold rounded-lg transition-all"
                :class="[activeSegment === 'regulars' ? 'bg-white dark:bg-neutral-900 text-emerald-500 shadow-sm border border-neutral-200/50 dark:border-neutral-800/50' : 'text-neutral-400']"
                @click="activeSegment = 'regulars'"
              >
                Regulars
              </button>
              <button
                type="button"
                class="py-2 text-xs font-bold rounded-lg transition-all"
                :class="[activeSegment === 'all' ? 'bg-white dark:bg-neutral-900 text-emerald-500 shadow-sm border border-neutral-200/50 dark:border-neutral-800/50' : 'text-neutral-400']"
                @click="activeSegment = 'all'"
              >
                All Clients
              </button>
            </div>
          </UFormGroup>

          <!-- Email Subject -->
          <UFormGroup
            label="Campaign Subject"
            required
          >
            <input
              v-model="subject"
              type="text"
              required
              placeholder="e.g. Special Peak Hour Surcharge Discount!"
              class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
          </UFormGroup>

          <!-- Email Content Body -->
          <UFormGroup
            label="Broadcast Message Body"
            required
          >
            <textarea
              v-model="message"
              required
              placeholder="Dear Member, we are pleased to offer you exclusive free racket rentals..."
              rows="6"
              class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </UFormGroup>

          <UButton
            type="submit"
            label="Dispatch Broadcast"
            color="success"
            icon="i-lucide-send-to-back"
            block
            :loading="submitting"
            :disabled="activeRecipients.length === 0"
            class="font-semibold shadow-sm shadow-emerald-500/10"
          />
        </form>
      </div>

      <!-- Segment Details (Right Sidebar) -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm">
          <h3 class="font-bold text-sm text-neutral-800 dark:text-neutral-200 mb-4 flex items-center justify-between">
            <span>Recipient Segment ({{ activeRecipients.length }})</span>
            <UBadge
              color="success"
              variant="subtle"
              size="sm"
            >
              {{ activeSegment }}
            </UBadge>
          </h3>

          <div
            v-if="activeRecipients.length > 0"
            class="max-h-72 overflow-y-auto space-y-3 pr-2 scrollbar-thin"
          >
            <div
              v-for="c in activeRecipients"
              :key="c.id"
              class="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50"
            >
              <div class="min-w-0">
                <p class="font-bold text-xs text-neutral-800 dark:text-neutral-200 truncate">
                  {{ c.name }}
                </p>
                <p class="text-[10px] text-neutral-400 truncate mt-0.5">
                  {{ c.email }}
                </p>
              </div>
              <span
                class="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded"
                :class="[c.tier === 'member' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400']"
              >
                {{ c.tier }}
              </span>
            </div>
          </div>

          <div
            v-else-if="loading"
            class="flex flex-col items-center justify-center py-8"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="w-6 h-6 text-emerald-500 animate-spin"
            />
            <p class="text-xs text-neutral-400 mt-2">
              Compiling target segments...
            </p>
          </div>

          <div
            v-else
            class="text-center py-8 text-xs text-neutral-400"
          >
            No contacts found in this segment.
          </div>
        </div>

        <!-- Success Modal/Report Box -->
        <div
          v-if="dispatchResult"
          class="bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-6 shadow-sm space-y-4 animate-scale-in"
        >
          <div class="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <UIcon
              name="i-lucide-check-circle-2"
              class="w-5 h-5"
            />
            Dispatch Summary
          </div>
          <div class="text-xs space-y-2 text-neutral-600 dark:text-neutral-400">
            <p><strong>Cohort:</strong> {{ dispatchResult.campaign.segment }}</p>
            <p><strong>Delivery Count:</strong> {{ dispatchResult.campaign.recipientCount }} users</p>
            <p><strong>Timestamp:</strong> {{ new Date(dispatchResult.campaign.timestamp).toLocaleTimeString() }}</p>
          </div>
          <div class="border-t border-emerald-500/10 pt-3 text-[10px] text-emerald-600/70 font-semibold uppercase tracking-wider">
            All mock notifications delivered successfully.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
