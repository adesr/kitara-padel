<script setup lang="ts">
import { usePricing } from '../composables/usePricing'
import type { Court, Booking, User } from '~/../server/utils/db'

interface ClientBooking extends Booking {
  courtName?: string
  userName?: string
}

interface BookingResponse {
  success: boolean
  booking: Booking
}

const props = defineProps<{
  branchId: string
  isAdminView?: boolean
}>()

const emit = defineEmits(['bookingCreated'])

const { calculateLocalPricing } = usePricing()
const toast = useToast()

const selectedDate = ref<string>(new Date().toISOString().split('T')[0] || '')
const courts = ref<Court[]>([])
const bookings = ref<ClientBooking[]>([])
const users = ref<User[]>([])
const loading = ref(false)

// Current active session user
const sessionUser = useState<User | null>('user', () => null)

// Form / Modal State
const bookingModalOpen = ref(false)
const submitting = ref(false)
const formErrors = ref<string | null>(null)

const form = ref({
  courtId: '',
  userId: '',
  startTime: '08:00',
  endTime: '10:00',
  racketCount: 0,
  ballCount: 0
})

// Time slots for grid (2-hour slots to keep the interface spacious and sleek)
const timeSlots = [
  { label: '08:00 - 10:00', startHour: 8, endHour: 10 },
  { label: '10:00 - 12:00', startHour: 10, endHour: 12 },
  { label: '12:00 - 14:00', startHour: 12, endHour: 14 },
  { label: '14:00 - 16:00', startHour: 14, endHour: 16 },
  { label: '16:00 - 18:00', startHour: 16, endHour: 18 },
  { label: '18:00 - 20:00', startHour: 18, endHour: 20 },
  { label: '20:00 - 22:00', startHour: 20, endHour: 22 }
]

// Fetch courts and bookings
const fetchData = async () => {
  if (!props.branchId) return
  loading.value = true
  try {
    const [courtsData, bookingsData, usersData] = await Promise.all([
      $fetch<Court[]>(`/api/courts?branchId=${props.branchId}`),
      $fetch<ClientBooking[]>(`/api/bookings?date=${selectedDate.value}`),
      $fetch<User[]>(`/api/users`)
    ])

    // Only display active courts, or all courts for admins
    courts.value = props.isAdminView ? courtsData : courtsData.filter(c => c.isActive)
    bookings.value = bookingsData
    users.value = usersData
  } catch (e: unknown) {
    const err = e as { statusMessage?: string, message?: string }
    toast.add({
      title: 'Fetch failed',
      description: err.statusMessage || err.message || 'Unable to download calendar data.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Watch for date or branch changes
watch(() => [props.branchId, selectedDate.value], () => {
  fetchData()
}, { immediate: true })

// Check if a specific slot has a booking
const getBookingForSlot = (courtId: string, slot: typeof timeSlots[0]) => {
  return bookings.value.find((b) => {
    if (b.courtId !== courtId || b.status !== 'confirmed') return false

    const bStart = new Date(b.startTime)
    const bEnd = new Date(b.endTime)

    // Create Date objects representing the grid slot on the selected day
    const slotStart = new Date(selectedDate.value)
    slotStart.setHours(slot.startHour, 0, 0, 0)
    const slotEnd = new Date(selectedDate.value)
    slotEnd.setHours(slot.endHour, 0, 0, 0)

    // Matches if the booking overlaps with this grid slot
    return bStart < slotEnd && bEnd > slotStart
  })
}

// Open booking dialog
const openBookingModal = (courtId: string, slot: typeof timeSlots[0]) => {
  formErrors.value = null
  form.value = {
    courtId,
    userId: sessionUser.value?.id || '',
    startTime: `${slot.startHour.toString().padStart(2, '0')}:00`,
    endTime: `${slot.endHour.toString().padStart(2, '0')}:00`,
    racketCount: 0,
    ballCount: 0
  }
  bookingModalOpen.value = true
}

// Live Pricing Calculations Preview
const pricePreview = computed(() => {
  if (!form.value.courtId) return null

  // Find selected user tier
  const bookingUser = users.value.find(u => u.id === form.value.userId)
  const tier = bookingUser?.tier || 'general'

  // Construct start/end dates
  const start = new Date(selectedDate.value)
  const [sH, sM] = form.value.startTime.split(':').map(Number) as [number, number]
  start.setHours(sH, sM, 0, 0)

  const end = new Date(selectedDate.value)
  const [eH, eM] = form.value.endTime.split(':').map(Number) as [number, number]
  end.setHours(eH, eM, 0, 0)

  return calculateLocalPricing(
    start.toISOString(),
    end.toISOString(),
    tier,
    { racketCount: form.value.racketCount, ballCount: form.value.ballCount }
  )
})

// Submit booking request
const handleCreateBooking = async () => {
  formErrors.value = null
  submitting.value = true

  try {
    // Construct start/end timestamp ISO strings
    const start = new Date(selectedDate.value)
    const [sH, sM] = form.value.startTime.split(':').map(Number) as [number, number]
    start.setHours(sH, sM, 0, 0)

    const end = new Date(selectedDate.value)
    const [eH, eM] = form.value.endTime.split(':').map(Number) as [number, number]
    end.setHours(eH, eM, 0, 0)

    const payload = {
      courtId: form.value.courtId,
      userId: form.value.userId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      racketCount: form.value.racketCount,
      ballCount: form.value.ballCount
    }

    const response = await $fetch<BookingResponse>('/api/bookings', {
      method: 'POST',
      body: payload
    })

    if (response.success) {
      toast.add({
        title: 'Booking Confirmed!',
        description: `Successfully reserved court for $${response.booking.finalPrice}`,
        color: 'success'
      })
      bookingModalOpen.value = false
      fetchData()
      emit('bookingCreated')
    }
  } catch (e: unknown) {
    const err = e as { statusMessage?: string, message?: string }
    formErrors.value = err.statusMessage || err.message || 'An error occurred during reservation.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Filters Header -->
    <div class="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50">
      <div class="flex items-center gap-3">
        <UIcon
          name="i-lucide-calendar"
          class="text-emerald-500 w-5 h-5"
        />
        <span class="font-semibold text-neutral-800 dark:text-neutral-200">Selected Day:</span>
        <input
          v-model="selectedDate"
          type="date"
          class="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
      </div>
      <UButton
        icon="i-lucide-rotate-cw"
        color="neutral"
        variant="ghost"
        :loading="loading"
        @click="fetchData"
      />
    </div>

    <!-- Calendar Grid -->
    <div
      v-if="courts.length > 0"
      class="overflow-x-auto bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm"
    >
      <table class="w-full min-w-[700px] border-collapse text-left">
        <thead>
          <tr class="border-b border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-950/20">
            <th class="p-4 w-40 text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              Time Slot
            </th>
            <th
              v-for="court in courts"
              :key="court.id"
              class="p-4 text-sm font-semibold text-neutral-800 dark:text-neutral-200 border-l border-neutral-200/30 dark:border-neutral-800/30"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-bold">
                    {{ court.name }}
                  </p>
                  <p class="text-xs text-neutral-400 font-normal mt-0.5">
                    {{ court.type }}
                  </p>
                </div>
                <UBadge
                  v-if="!court.isActive"
                  color="error"
                  variant="subtle"
                  size="sm"
                >
                  Inactive
                </UBadge>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="slot in timeSlots"
            :key="slot.label"
            class="border-b border-neutral-100 dark:border-neutral-800/30 last:border-0 hover:bg-neutral-50/20 dark:hover:bg-neutral-950/10"
          >
            <td class="p-4 font-medium text-xs text-neutral-500 align-middle">
              {{ slot.label }}
            </td>
            <td
              v-for="court in courts"
              :key="court.id"
              class="p-2 border-l border-neutral-200/30 dark:border-neutral-800/30 align-middle min-h-[90px]"
            >
              <!-- Cell Booking content -->
              <div
                v-if="getBookingForSlot(court.id, slot)"
                class="group relative bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 transition-all duration-200 hover:shadow-md"
              >
                <div class="flex items-start justify-between">
                  <span class="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {{ getBookingForSlot(court.id, slot)?.userName || 'Reserved' }}
                  </span>
                  <span class="text-[10px] text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-medium">
                    ${{ getBookingForSlot(court.id, slot)?.finalPrice }}
                  </span>
                </div>
                <p class="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                  <UIcon
                    name="i-lucide-clock"
                    class="w-3 h-3"
                  />
                  Reserved
                </p>
              </div>

              <!-- Available slot (interactive trigger) -->
              <div
                v-else-if="court.isActive"
                class="group flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg py-4 px-3 text-neutral-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-500 cursor-pointer transition-all duration-200"
                @click="openBookingModal(court.id, slot)"
              >
                <UIcon
                  name="i-lucide-plus"
                  class="w-5 h-5 mb-1 opacity-40 group-hover:scale-110 transition-transform duration-200"
                />
                <span class="text-[10px] font-medium tracking-wide uppercase">Open Slot</span>
              </div>

              <div
                v-else
                class="flex flex-col items-center justify-center border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/20 rounded-lg py-4 px-3 text-neutral-400"
              >
                <UIcon
                  name="i-lucide-ban"
                  class="w-4 h-4 mb-1 opacity-30"
                />
                <span class="text-[10px] uppercase tracking-wider">Unavailable</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state for no courts -->
    <div
      v-else
      class="flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl py-12 px-4 text-center"
    >
      <UIcon
        name="i-lucide-alert-circle"
        class="w-8 h-8 text-neutral-400 mb-2"
      />
      <p class="font-medium text-neutral-700 dark:text-neutral-300">
        No active courts
      </p>
      <p class="text-sm text-neutral-500 mt-1">
        Activate courts in the Admin inventory view to enable bookings.
      </p>
    </div>

    <!-- Booking Creation Modal Dialog -->
    <UModal
      v-model:open="bookingModalOpen"
      title="New Padel Court Reservation"
    >
      <template #body>
        <div class="space-y-4">
          <p
            v-if="formErrors"
            class="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2"
          >
            <UIcon
              name="i-lucide-alert-triangle"
              class="w-4 h-4 shrink-0"
            />
            {{ formErrors }}
          </p>

          <!-- User selection -->
          <UFormGroup
            label="Reserve For Client"
            required
          >
            <select
              v-model="form.userId"
              class="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option
                value=""
                disabled
              >
                Select Client
              </option>
              <option
                v-for="u in users.filter(usr => usr.role === 'customer')"
                :key="u.id"
                :value="u.id"
              >
                {{ u.name }} ({{ u.tier === 'member' ? 'Member - 20% Off' : 'General' }})
              </option>
            </select>
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup
              label="Start Time"
              required
            >
              <input
                v-model="form.startTime"
                type="time"
                class="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
            </UFormGroup>

            <UFormGroup
              label="End Time"
              required
            >
              <input
                v-model="form.endTime"
                type="time"
                class="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
            </UFormGroup>
          </div>

          <!-- Add-on upgrades -->
          <div class="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <UIcon name="i-lucide-shopping-cart" />
              Upgrades & Accessory Rentals
            </h4>

            <div class="flex items-center justify-between">
              <div class="text-xs">
                <p class="font-semibold text-neutral-700 dark:text-neutral-300">
                  Racket Rentals
                </p>
                <p class="text-[10px] text-neutral-400">
                  Professional padel rackets ($5.00 each)
                </p>
              </div>
              <input
                v-model.number="form.racketCount"
                type="number"
                min="0"
                max="4"
                class="w-16 px-2 py-1 text-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm"
              >
            </div>

            <div class="flex items-center justify-between">
              <div class="text-xs">
                <p class="font-semibold text-neutral-700 dark:text-neutral-300">
                  Padel Balls Package
                </p>
                <p class="text-[10px] text-neutral-400">
                  Set of 3 brand new pressurized balls ($3.00/pack)
                </p>
              </div>
              <input
                v-model.number="form.ballCount"
                type="number"
                min="0"
                max="4"
                class="w-16 px-2 py-1 text-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm"
              >
            </div>
          </div>

          <!-- Live Price Preview Card -->
          <div
            v-if="pricePreview"
            class="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-xs space-y-2"
          >
            <div class="flex justify-between">
              <span class="text-neutral-500">Duration:</span>
              <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ pricePreview.durationHours.toFixed(1) }} hr(s)</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">Court Base Rate:</span>
              <span class="font-medium text-neutral-700 dark:text-neutral-300">${{ pricePreview.baseTotal.toFixed(2) }}</span>
            </div>
            <div
              v-if="pricePreview.isPeak"
              class="flex justify-between text-amber-500 font-medium"
            >
              <span>Peak surcharge (+20%):</span>
              <span>+${{ (pricePreview.baseTotal * 0.2).toFixed(2) }}</span>
            </div>
            <div
              v-if="pricePreview.discountPercent > 0"
              class="flex justify-between text-emerald-500 font-medium"
            >
              <span>Member discount (-20%):</span>
              <span>-${{ (pricePreview.baseTotal * (1 + pricePreview.peakSurcharge) * 0.2).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">Addons (Rackets/Balls):</span>
              <span class="font-medium text-neutral-700 dark:text-neutral-300">${{ (pricePreview.racketFee + pricePreview.ballFee).toFixed(2) }}</span>
            </div>
            <div class="border-t border-emerald-500/20 pt-2 flex justify-between font-bold text-sm text-emerald-700 dark:text-emerald-400">
              <span>Total Price:</span>
              <span>${{ pricePreview.totalPrice.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="bookingModalOpen = false"
          />
          <UButton
            label="Confirm Booking"
            color="success"
            :loading="submitting"
            :disabled="!form.userId"
            @click="handleCreateBooking"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
