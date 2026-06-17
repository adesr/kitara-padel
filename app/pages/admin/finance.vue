<script setup lang="ts">
import type { Branch, FinanceLedger } from '~/../server/utils/db'
import FinanceReportCards from '../../components/FinanceReportCards.vue'

definePageMeta({
  layout: 'admin'
})

const reportCardsRef = ref<InstanceType<typeof FinanceReportCards> | null>(null)
const activeRange = ref(30)
const branches = ref<Branch[]>([])
const transactions = ref<FinanceLedger[]>([])
const loadingLedger = ref(false)
const submitting = ref(false)
const toast = useToast()

const form = ref({
  branchId: '',
  type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
  category: 'maintenance',
  amount: '',
  description: ''
})

const formErrors = ref<string | null>(null)

const categories = {
  INCOME: ['court_rental', 'racket_rent', 'beverage_sales', 'accessory_sales'],
  EXPENSE: ['maintenance', 'utility', 'staff_wages', 'equipment_purchase']
}

const fetchBranches = async () => {
  try {
    const data = await $fetch<Branch[]>('/api/branches')
    branches.value = data
    if (data.length > 0) {
      form.value.branchId = data[0]?.id || ''
    }
  } catch (e) {
    console.error('Failed to load branches', e)
  }
}

const fetchLedger = async () => {
  loadingLedger.value = true
  try {
    const ledgerData = await $fetch<FinanceLedger[]>('/api/finance/ledger')
    transactions.value = ledgerData.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
  } catch (e) {
    console.error('Failed to fetch ledger timeline', e)
  } finally {
    loadingLedger.value = false
  }
}

const handlePostTransaction = async () => {
  formErrors.value = null
  submitting.value = true

  try {
    const response = await $fetch<FinanceLedger>('/api/finance/transaction', {
      method: 'POST',
      body: form.value
    })

    if (response) {
      toast.add({
        title: 'Transaction Logged',
        description: `Successfully added ${form.value.type} record for $${parseFloat(form.value.amount).toFixed(2)}`,
        color: 'success'
      })
      // Reset form but preserve branch selection
      form.value = {
        branchId: form.value.branchId,
        type: 'EXPENSE',
        category: 'maintenance',
        amount: '',
        description: ''
      }
      // Refresh report cards dashboard graphs
      if (reportCardsRef.value) {
        reportCardsRef.value.refresh()
      }
      // Refresh timeline list
      fetchLedger()
    }
  } catch (e: unknown) {
    const err = e as { statusMessage?: string, message?: string }
    formErrors.value = err.statusMessage || err.message || 'Unable to log transaction. Verify inputs.'
  } finally {
    submitting.value = false
  }
}

// Auto update categories on type switch
watch(() => form.value.type, (newType) => {
  form.value.category = categories[newType][0] || ''
})

onMounted(async () => {
  await Promise.all([
    fetchBranches(),
    fetchLedger()
  ])
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-8 max-w-6xl mx-auto font-sans">
    <!-- Header banner -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 p-6 rounded-2xl shadow-sm">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
          <UIcon
            name="i-lucide-dollar-sign"
            class="w-6 h-6"
          />
        </div>
        <div>
          <h1 class="text-2xl font-black text-neutral-900 dark:text-white">
            Accounting Ledger
          </h1>
          <p class="text-xs text-neutral-500 mt-1">
            Review rolling financial performance metrics and manually post ledger entries
          </p>
        </div>
      </div>

      <!-- Range Filters -->
      <div class="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
        <button
          class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all"
          :class="[activeRange === 7 ? 'bg-white dark:bg-neutral-900 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 hover:text-neutral-700']"
          @click="activeRange = 7"
        >
          7 Days
        </button>
        <button
          class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all"
          :class="[activeRange === 30 ? 'bg-white dark:bg-neutral-900 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 hover:text-neutral-700']"
          @click="activeRange = 30"
        >
          30 Days
        </button>
      </div>
    </div>

    <!-- Stats Dashboard and Analytics Cards -->
    <FinanceReportCards
      ref="reportCardsRef"
      :range-days="activeRange"
    />

    <!-- Ledger action and list panel -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Create Ledger Entry Form -->
      <div class="lg:col-span-1 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm h-fit">
        <h3 class="font-bold text-base text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
          <UIcon
            name="i-lucide-edit-3"
            class="text-emerald-500"
          />
          Log Ledger Entry
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
          @submit.prevent="handlePostTransaction"
        >
          <UFormGroup
            label="Club Branch"
            required
          >
            <select
              v-model="form.branchId"
              class="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option
                v-for="b in branches"
                :key="b.id"
                :value="b.id"
              >
                {{ b.name }}
              </option>
            </select>
          </UFormGroup>

          <UFormGroup
            label="Entry Type"
            required
          >
            <div class="grid grid-cols-2 gap-2 p-1 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50">
              <button
                type="button"
                class="py-1.5 text-xs font-bold rounded-lg transition-all"
                :class="[form.type === 'INCOME' ? 'bg-white dark:bg-neutral-900 text-emerald-500 shadow-sm border border-neutral-200/50 dark:border-neutral-800/50' : 'text-neutral-400']"
                @click="form.type = 'INCOME'"
              >
                Income
              </button>
              <button
                type="button"
                class="py-1.5 text-xs font-bold rounded-lg transition-all"
                :class="[form.type === 'EXPENSE' ? 'bg-white dark:bg-neutral-900 text-rose-500 shadow-sm border border-neutral-200/50 dark:border-neutral-800/50' : 'text-neutral-400']"
                @click="form.type = 'EXPENSE'"
              >
                Expense
              </button>
            </div>
          </UFormGroup>

          <UFormGroup
            label="Accounting Category"
            required
          >
            <select
              v-model="form.category"
              class="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 capitalize"
            >
              <option
                v-for="cat in categories[form.type]"
                :key="cat"
                :value="cat"
              >
                {{ cat.replace('_', ' ') }}
              </option>
            </select>
          </UFormGroup>

          <UFormGroup
            label="Amount (USD)"
            required
          >
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-neutral-400 text-sm font-semibold">$</span>
              <input
                v-model="form.amount"
                type="text"
                required
                placeholder="0.00"
                class="w-full pl-7 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
            </div>
          </UFormGroup>

          <UFormGroup label="Transaction Details">
            <textarea
              v-model="form.description"
              placeholder="e.g. Monthly maintenance contract payout..."
              rows="3"
              class="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </UFormGroup>

          <UButton
            type="submit"
            label="Log Transaction"
            color="success"
            block
            :loading="submitting"
            class="font-semibold shadow-sm"
          />
        </form>
      </div>

      <!-- Ledger Timeline logs -->
      <div class="lg:col-span-2 space-y-4">
        <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-400">
          Ledger Timeline (Last 30 Days)
        </h3>

        <div
          v-if="transactions.length > 0"
          class="overflow-hidden bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm"
        >
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left text-xs">
              <thead>
                <tr class="border-b border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-950/20 text-neutral-500 font-semibold uppercase tracking-wider">
                  <th class="p-4">
                    Date
                  </th>
                  <th class="p-4">
                    Category
                  </th>
                  <th class="p-4">
                    Details
                  </th>
                  <th class="p-4 text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="tx in transactions.slice(0, 15)"
                  :key="tx.id"
                  class="border-b border-neutral-100 dark:border-neutral-800/30 last:border-0 hover:bg-neutral-50/20 dark:hover:bg-neutral-950/10"
                >
                  <td class="p-4 text-neutral-400 whitespace-nowrap">
                    {{ formatDate(tx.transactionDate) }}
                  </td>
                  <td class="p-4 font-semibold capitalize whitespace-nowrap">
                    <span
                      class="px-2 py-0.5 rounded text-[10px]"
                      :class="[
                        tx.type === 'INCOME'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      ]"
                    >
                      {{ tx.category.replace('_', ' ') }}
                    </span>
                  </td>
                  <td class="p-4 text-neutral-600 dark:text-neutral-400 max-w-[200px] truncate">
                    {{ tx.description || 'General transaction' }}
                  </td>
                  <td
                    class="p-4 text-right font-bold font-mono whitespace-nowrap"
                    :class="[tx.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500']"
                  >
                    {{ tx.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(parseFloat(tx.amount)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="transactions.length > 15"
            class="p-3 bg-neutral-50/50 dark:bg-neutral-950/20 text-center border-t border-neutral-100 dark:border-neutral-800/50 text-[10px] text-neutral-400"
          >
            Showing latest 15 operations out of {{ transactions.length }} logged rows.
          </div>
        </div>

        <!-- Loader -->
        <div
          v-else-if="loadingLedger"
          class="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="w-6 h-6 text-emerald-500 animate-spin"
          />
          <p class="text-xs text-neutral-500 mt-2">
            Opening general ledger archive...
          </p>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl py-16 px-4 text-center"
        >
          <UIcon
            name="i-lucide-folder-open"
            class="w-10 h-10 text-neutral-400 mb-2"
          />
          <p class="font-semibold text-neutral-700 dark:text-neutral-300">
            No Operations Recorded
          </p>
          <p class="text-xs text-neutral-500 mt-1">
            Book courts or log manual entries to generate balance ledger reports.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
