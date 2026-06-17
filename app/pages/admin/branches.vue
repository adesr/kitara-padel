<script setup lang="ts">
import type { Branch } from '~/../server/utils/db'

definePageMeta({
  layout: 'admin'
})

const branches = ref<Branch[]>([])
const loading = ref(true)
const submitting = ref(false)
const deletingId = ref<string | null>(null)
const toast = useToast()

const form = ref({
  name: '',
  address: ''
})

const formErrors = ref<string | null>(null)

const fetchBranches = async () => {
  loading.value = true
  try {
    const data = await $fetch<Branch[]>('/api/branches')
    branches.value = data
  } catch (error) {
    const statusMessage = error instanceof Error ? error.message : 'Unable to retrieve branch list.'
    toast.add({
      title: 'Fetch failed',
      description: statusMessage,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const handleCreateBranch = async () => {
  formErrors.value = null
  submitting.value = true

  try {
    const response = await $fetch<Branch>('/api/admin/branches', {
      method: 'POST',
      body: form.value
    })

    if (response) {
      toast.add({
        title: 'Branch Created!',
        description: `Successfully added ${response.name}`,
        color: 'success'
      })
      form.value = { name: '', address: '' }
      fetchBranches()
    }
  } catch (error) {
    const statusMessage = error instanceof Error ? error.message : 'Unable to create branch. Verify inputs.'
    formErrors.value = statusMessage
  } finally {
    submitting.value = false
  }
}

const handleDeleteBranch = async (id: string) => {
  if (!confirm('Are you sure you want to delete this branch? All courts, bookings, and financial logs for this branch will be permanently removed.')) {
    return
  }

  deletingId.value = id
  try {
    await $fetch('/api/admin/branches', {
      method: 'DELETE',
      body: { id }
    })
    toast.add({
      title: 'Branch Deleted',
      description: 'Successfully removed the branch and all associated records.',
      color: 'success'
    })
    fetchBranches()
  } catch (error) {
    const statusMessage = error instanceof Error ? error.message : 'Unable to delete branch.'
    toast.add({
      title: 'Delete failed',
      description: statusMessage,
      color: 'error'
    })
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  fetchBranches()
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="space-y-8 max-w-5xl mx-auto font-sans">
    <!-- Header banner -->
    <div class="flex items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 p-6 rounded-2xl shadow-sm">
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
        <UIcon
          name="i-lucide-building-2"
          class="w-6 h-6"
        />
      </div>
      <div>
        <h1 class="text-2xl font-black text-neutral-900 dark:text-white">
          Club Branches
        </h1>
        <p class="text-xs text-neutral-500 mt-1">
          Configure and view regional court facility centers
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Create Branch Form -->
      <div class="md:col-span-1 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm h-fit">
        <h3 class="font-bold text-base text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
          <UIcon
            name="i-lucide-plus"
            class="text-emerald-500"
          />
          Create New Branch
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
          @submit.prevent="handleCreateBranch"
        >
          <UFormGroup
            label="Branch Name"
            required
          >
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="e.g. Kitara Padel Uptown"
              class="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
          </UFormGroup>

          <UFormGroup label="Full Address">
            <textarea
              v-model="form.address"
              placeholder="e.g. 500 Park Avenue, Suite 10"
              rows="3"
              class="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </UFormGroup>

          <UButton
            type="submit"
            label="Save Branch"
            color="success"
            block
            :loading="submitting"
            class="font-semibold shadow-sm shadow-emerald-500/10"
          />
        </form>
      </div>

      <!-- Branches Listing Grid -->
      <div class="md:col-span-2 space-y-4">
        <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-400">
          Registered Branches
        </h3>

        <div
          v-if="branches.length > 0"
          class="grid grid-cols-1 gap-4"
        >
          <div
            v-for="b in branches"
            :key="b.id"
            class="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-5 shadow-sm hover:border-emerald-500/20 transition-colors duration-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div class="space-y-1">
              <h4 class="font-bold text-neutral-950 dark:text-neutral-50">
                {{ b.name }}
              </h4>
              <p class="text-xs text-neutral-500 flex items-center gap-1">
                <UIcon
                  name="i-lucide-map-pin"
                  class="w-3.5 h-3.5 text-neutral-400 shrink-0"
                />
                {{ b.address || 'Address not registered' }}
              </p>
            </div>

            <div class="text-left sm:text-right border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800 pt-3 sm:pt-0 shrink-0 flex sm:flex-col gap-2 justify-between items-start sm:items-end">
              <span class="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                <UIcon name="i-lucide-calendar" />
                Added: {{ formatDate(b.createdAt) }}
              </span>

              <div class="flex items-center gap-2">
                <!-- Quick Link to Court Settings -->
                <UButton
                  to="/admin/courts"
                  label="Manage Courts"
                  icon="i-lucide-layout-grid"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  class="font-semibold"
                />
                <UButton
                  color="error"
                  variant="subtle"
                  icon="i-lucide-trash-2"
                  size="xs"
                  :loading="deletingId === b.id"
                  @click="handleDeleteBranch(b.id)"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="loading"
          class="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="w-6 h-6 text-emerald-500 animate-spin"
          />
          <p class="text-xs text-neutral-500 mt-2">
            Reading branches...
          </p>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl py-16 px-4 text-center"
        >
          <UIcon
            name="i-lucide-building"
            class="w-10 h-10 text-neutral-400 mb-2"
          />
          <p class="font-semibold text-neutral-700 dark:text-neutral-300">
            No Branches Setup
          </p>
          <p class="text-xs text-neutral-500 mt-1 max-w-xs">
            Create your first facility branch using the form on the left.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
