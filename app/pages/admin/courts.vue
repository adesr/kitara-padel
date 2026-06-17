<script setup lang="ts">
import type { Branch, Court } from '~/../server/utils/db'

definePageMeta({
  layout: 'admin'
})

const branches = ref<Branch[]>([])
const selectedBranchId = ref('')
const courts = ref<Court[]>([])
const loading = ref(true)
const submitting = ref(false)
const deletingId = ref<string | null>(null)
const toast = useToast()

const form = ref({
  name: '',
  type: 'Panoramic',
  isActive: true
})

const formErrors = ref<string | null>(null)

const courtTypes = ['Panoramic', 'Indoor', 'Outdoor']

const fetchBranches = async () => {
  try {
    const branchesData = await $fetch<Branch[]>('/api/branches')
    branches.value = branchesData
    if (branchesData.length > 0 && !selectedBranchId.value) {
      selectedBranchId.value = branchesData[0]?.id || ''
    }
  } catch {
    toast.add({
      title: 'Fetch failed',
      description: 'Unable to retrieve branches.',
      color: 'error'
    })
  }
}

const fetchCourts = async () => {
  if (!selectedBranchId.value) return
  loading.value = true
  try {
    const courtsData = await $fetch<Court[]>(`/api/courts?branchId=${selectedBranchId.value}`)
    courts.value = courtsData
  } catch {
    toast.add({
      title: 'Fetch failed',
      description: 'Unable to retrieve courts inventory list.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Handle toggling court activation switch
const handleToggleActive = async (court: Court) => {
  const previousState = court.isActive
  // Optimizely update locally for snappier UI feel
  court.isActive = !previousState

  try {
    const response = await $fetch<Court>('/api/admin/courts', {
      method: 'POST',
      body: {
        id: court.id,
        isActive: court.isActive
      }
    })

    if (response) {
      toast.add({
        title: 'Court Status Updated',
        description: `Set ${court.name} to ${court.isActive ? 'Active' : 'Inactive'}`,
        color: court.isActive ? 'success' : 'neutral'
      })
    }
  } catch (e: unknown) {
    const err = e as { statusMessage?: string, message?: string }
    // Revert state if api fails
    court.isActive = previousState
    toast.add({
      title: 'Update failed',
      description: err.statusMessage || err.message || 'Unable to update court status.',
      color: 'error'
    })
  }
}

const handleCreateCourt = async () => {
  if (!selectedBranchId.value) return
  formErrors.value = null
  submitting.value = true

  try {
    const payload = {
      branchId: selectedBranchId.value,
      name: form.value.name,
      type: form.value.type,
      isActive: form.value.isActive
    }

    const response = await $fetch<Court>('/api/admin/courts', {
      method: 'POST',
      body: payload
    })

    if (response) {
      toast.add({
        title: 'Court Created!',
        description: `Successfully added ${form.value.name}`,
        color: 'success'
      })
      form.value = { name: '', type: 'Panoramic', isActive: true }
      fetchCourts()
    }
  } catch (e: unknown) {
    const err = e as { statusMessage?: string, message?: string }
    formErrors.value = err.statusMessage || err.message || 'Unable to create court. Verify inputs.'
  } finally {
    submitting.value = false
  }
}

const handleDeleteCourt = async (id: string) => {
  if (!confirm('Are you sure you want to delete this court? All bookings associated with this court will be permanently deleted.')) {
    return
  }

  deletingId.value = id
  try {
    await $fetch('/api/admin/courts', {
      method: 'DELETE',
      body: { id }
    })
    toast.add({
      title: 'Court Deleted',
      description: 'Successfully removed the court from inventory.',
      color: 'success'
    })
    fetchCourts()
  } catch (error) {
    const statusMessage = error instanceof Error ? error.message : 'Unable to delete court.'
    toast.add({
      title: 'Delete failed',
      description: statusMessage,
      color: 'error'
    })
  } finally {
    deletingId.value = null
  }
}

// Initial load
onMounted(async () => {
  await fetchBranches()
  if (selectedBranchId.value) {
    await fetchCourts()
  }
})

// Watch branch selection to reload courts
watch(selectedBranchId, () => {
  fetchCourts()
})
</script>

<template>
  <div class="space-y-8 max-w-5xl mx-auto font-sans">
    <!-- Header banner -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 p-6 rounded-2xl shadow-sm">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
          <UIcon
            name="i-lucide-layout-grid"
            class="w-6 h-6"
          />
        </div>
        <div>
          <h1 class="text-2xl font-black text-neutral-900 dark:text-white">
            Court Inventory
          </h1>
          <p class="text-xs text-neutral-500 mt-1">
            Manage active court fields and configure booking status
          </p>
        </div>
      </div>

      <!-- Branch selection dropdown -->
      <div
        v-if="branches.length > 0"
        class="flex items-center gap-2"
      >
        <UIcon
          name="i-lucide-filter"
          class="text-neutral-400 w-4 h-4"
        />
        <select
          v-model="selectedBranchId"
          class="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option
            v-for="b in branches"
            :key="b.id"
            :value="b.id"
          >
            {{ b.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Main Content -->
    <div
      v-if="branches.length > 0"
      class="grid grid-cols-1 md:grid-cols-3 gap-8"
    >
      <!-- Create Court Form -->
      <div class="md:col-span-1 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm h-fit">
        <h3 class="font-bold text-base text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
          <UIcon
            name="i-lucide-plus"
            class="text-emerald-500"
          />
          Create Padel Court
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
          class="space-y-4"
          @submit.prevent="handleCreateCourt"
        >
          <UFormGroup
            label="Court Name"
            required
          >
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="e.g. Court 4 - Center Stage"
              class="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
          </UFormGroup>

          <UFormGroup
            label="Court Type"
            required
          >
            <select
              v-model="form.type"
              class="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option
                v-for="t in courtTypes"
                :key="t"
                :value="t"
              >
                {{ t }} Court
              </option>
            </select>
          </UFormGroup>

          <div class="flex items-center justify-between py-2 border-t border-b border-neutral-100 dark:border-neutral-800">
            <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Set Active on Save</span>
            <input
              v-model="form.isActive"
              type="checkbox"
              class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-neutral-300 rounded"
            >
          </div>

          <UButton
            type="submit"
            label="Save Court"
            color="success"
            block
            :loading="submitting"
            class="font-semibold shadow-sm shadow-emerald-500/10"
          />
        </form>
      </div>

      <!-- Courts list -->
      <div class="md:col-span-2 space-y-4">
        <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-400">
          Courts Inventory
        </h3>

        <div
          v-if="courts.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div
            v-for="c in courts"
            :key="c.id"
            class="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:shadow-md"
            :class="[!c.isActive ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-950/20' : '']"
          >
            <div>
              <div class="flex items-start justify-between">
                <h4 class="font-bold text-sm text-neutral-950 dark:text-neutral-50">
                  {{ c.name }}
                </h4>
                <UBadge
                  :color="c.isActive ? 'success' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ c.isActive ? 'Active' : 'Offline' }}
                </UBadge>
              </div>
              <span class="text-[10px] text-neutral-400 font-mono mt-1 block">{{ c.type }} Padel Court</span>
            </div>

            <!-- Activation switch toggler -->
            <div class="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/50 pt-4 mt-4 text-xs">
              <span class="text-neutral-500">Booking Status</span>

              <div class="flex items-center gap-3">
                <button
                  class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  :class="[c.isActive ? 'bg-emerald-500' : 'bg-neutral-200 dark:bg-neutral-800']"
                  @click="handleToggleActive(c)"
                >
                  <span
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    :class="[c.isActive ? 'translate-x-5' : 'translate-x-0']"
                  />
                </button>
                <UButton
                  color="error"
                  variant="subtle"
                  icon="i-lucide-trash-2"
                  size="xs"
                  :loading="deletingId === c.id"
                  @click="handleDeleteCourt(c.id)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Loader -->
        <div
          v-else-if="loading"
          class="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="w-6 h-6 text-emerald-500 animate-spin"
          />
          <p class="text-xs text-neutral-500 mt-2">
            Checking court settings...
          </p>
        </div>

        <!-- Empty state -->
        <div
          v-else
          class="flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl py-16 px-4 text-center"
        >
          <UIcon
            name="i-lucide-layout"
            class="w-10 h-10 text-neutral-400 mb-2"
          />
          <p class="font-semibold text-neutral-700 dark:text-neutral-300">
            No Courts Registered
          </p>
          <p class="text-xs text-neutral-500 mt-1 max-w-xs">
            Register your first court field for this branch using the form on the left.
          </p>
        </div>
      </div>
    </div>

    <!-- Empty state for no branches at all -->
    <div
      v-else
      class="flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl py-20 px-4 text-center"
    >
      <UIcon
        name="i-lucide-building"
        class="w-12 h-12 text-neutral-400 mb-2"
      />
      <h3 class="font-bold text-neutral-800 dark:text-neutral-200">
        No Branch Registered
      </h3>
      <p class="text-sm text-neutral-500 mt-1">
        Please register a branch location first before configuring court inventory fields.
      </p>
      <UButton
        to="/admin/branches"
        label="Setup Branches"
        color="success"
        class="mt-4 font-bold shadow-sm"
      />
    </div>
  </div>
</template>
