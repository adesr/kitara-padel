<script setup lang="ts">
interface FinanceBreakdownItem {
  date: string
  income: number
  expense: number
}

interface FinanceCategoryBreakdownItem {
  category: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
}

interface FinanceReportData {
  totalIncome: number
  totalExpense: number
  netRevenue: number
  breakdown: FinanceBreakdownItem[]
  categoryBreakdown: FinanceCategoryBreakdownItem[]
}

const props = defineProps<{
  rangeDays: number
}>()

const report = ref<FinanceReportData | null>(null)
const loading = ref(false)
const toast = useToast()

const fetchReport = async () => {
  loading.value = true
  try {
    const data = await $fetch<FinanceReportData>(`/api/finance/report?range=${props.rangeDays}`)
    report.value = data
  } catch (e: unknown) {
    const err = e as { statusMessage?: string, message?: string }
    toast.add({
      title: 'Report failed',
      description: err.statusMessage || err.message || 'Unable to load ledger rollups.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

watch(() => props.rangeDays, () => {
  fetchReport()
}, { immediate: true })

defineExpose({
  refresh: fetchReport
})

// Calculate maximum height value for chart scaling
const maxChartValue = computed(() => {
  if (!report.value || report.value.breakdown.length === 0) return 100
  const vals = report.value.breakdown.map((d: FinanceBreakdownItem) => Math.max(d.income, d.expense))
  return Math.max(...vals, 10)
})

// Formatting utility
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

// Date label formatting
const formatDateLabel = (dateStr: string | undefined) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loader -->
    <div
      v-if="loading && !report"
      class="flex flex-col items-center justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 text-emerald-500 animate-spin"
      />
      <p class="text-sm text-neutral-500 mt-2">
        Aggregating financial ledger records...
      </p>
    </div>

    <div
      v-else-if="report"
      class="space-y-8 animate-fade-in"
    >
      <!-- Statistics Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Income Card -->
        <div class="relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm group hover:border-emerald-500/30 transition-all duration-300">
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <UIcon
              name="i-lucide-trending-up"
              class="w-24 h-24 text-emerald-500"
            />
          </div>
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <UIcon
                name="i-lucide-arrow-up-right"
                class="w-5 h-5"
              />
            </div>
            <span class="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Income</span>
          </div>
          <p class="text-3xl font-black mt-4 tracking-tight text-neutral-900 dark:text-white">
            {{ formatCurrency(report.totalIncome) }}
          </p>
          <div class="text-[10px] text-neutral-500 mt-2 flex items-center gap-1">
            <UIcon name="i-lucide-clock" />
            Rolling {{ rangeDays }} days rollup
          </div>
        </div>

        <!-- Expense Card -->
        <div class="relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm group hover:border-rose-500/30 transition-all duration-300">
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <UIcon
              name="i-lucide-trending-down"
              class="w-24 h-24 text-rose-500"
            />
          </div>
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
              <UIcon
                name="i-lucide-arrow-down-left"
                class="w-5 h-5"
              />
            </div>
            <span class="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Expenses</span>
          </div>
          <p class="text-3xl font-black mt-4 tracking-tight text-neutral-900 dark:text-white">
            {{ formatCurrency(report.totalExpense) }}
          </p>
          <div class="text-[10px] text-neutral-500 mt-2 flex items-center gap-1">
            <UIcon name="i-lucide-clock" />
            Rolling {{ rangeDays }} days rollup
          </div>
        </div>

        <!-- Net Revenue Card -->
        <div
          class="relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm group hover:border-blue-500/30 transition-all duration-300"
          :class="[report.netRevenue >= 0 ? 'hover:border-emerald-500/30' : 'hover:border-red-500/30']"
        >
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <UIcon
              name="i-lucide-dollar-sign"
              class="w-24 h-24 text-blue-500"
            />
          </div>
          <div class="flex items-center gap-3">
            <div
              class="p-2.5 rounded-xl"
              :class="[report.netRevenue >= 0 ? 'bg-teal-500/10 text-teal-500' : 'bg-red-500/10 text-red-500']"
            >
              <UIcon
                name="i-lucide-scale"
                class="w-5 h-5"
              />
            </div>
            <span class="text-xs font-bold uppercase tracking-wider text-neutral-400">Net Revenue</span>
          </div>
          <p
            class="text-3xl font-black mt-4 tracking-tight"
            :class="[report.netRevenue >= 0 ? 'text-emerald-500' : 'text-rose-500']"
          >
            {{ formatCurrency(report.netRevenue) }}
          </p>
          <div class="text-[10px] text-neutral-500 mt-2 flex items-center gap-1">
            <UIcon name="i-lucide-clock" />
            Rolling {{ rangeDays }} days ledger balance
          </div>
        </div>
      </div>

      <!-- Financial Chart Visualization -->
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm">
        <h3 class="font-bold text-base text-neutral-800 dark:text-neutral-200 mb-6 flex items-center gap-2">
          <UIcon
            name="i-lucide-bar-chart-3"
            class="text-emerald-500"
          />
          Revenue vs Expense History
        </h3>

        <!-- Chart Grid -->
        <div class="space-y-6">
          <div class="h-64 flex items-end gap-3 px-2 border-b border-neutral-100 dark:border-neutral-800">
            <div
              v-for="day in report.breakdown"
              :key="day.date"
              class="flex-1 flex flex-col justify-end items-center h-full group relative"
            >
              <!-- Tooltip on hover -->
              <div class="absolute bottom-full mb-2 bg-neutral-900 text-white text-[10px] rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl pointer-events-none z-10 w-28 text-center border border-neutral-800">
                <p class="font-bold text-[9px] border-b border-neutral-800 pb-1 mb-1">
                  {{ formatDateLabel(day.date) }}
                </p>
                <p class="text-emerald-400 font-medium">
                  Inc: ${{ day.income.toFixed(0) }}
                </p>
                <p class="text-rose-400 font-medium">
                  Exp: ${{ day.expense.toFixed(0) }}
                </p>
              </div>

              <!-- Bar pillars -->
              <div class="w-full flex justify-center items-end gap-1 max-w-[40px] h-full pb-1">
                <!-- Income Pillar -->
                <div
                  class="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-700 dark:to-emerald-500 rounded-t-sm transition-all duration-300 min-h-[4px]"
                  :style="{ height: `${Math.max(4, (day.income / maxChartValue) * 100)}%` }"
                />
                <!-- Expense Pillar -->
                <div
                  class="w-1/2 bg-gradient-to-t from-rose-600 to-rose-400 dark:from-rose-700 dark:to-rose-500 rounded-t-sm transition-all duration-300 min-h-[4px]"
                  :style="{ height: `${Math.max(4, (day.expense / maxChartValue) * 100)}%` }"
                />
              </div>
            </div>
          </div>

          <!-- X-Axis Labels (Display a selection of labels to keep UI readable) -->
          <div class="flex justify-between text-[10px] text-neutral-400 font-mono px-2">
            <span>{{ formatDateLabel(report.breakdown[0]?.date) }}</span>
            <span v-if="report.breakdown.length > 7">{{ formatDateLabel(report.breakdown[Math.floor(report.breakdown.length / 2)]?.date) }}</span>
            <span>{{ formatDateLabel(report.breakdown[report.breakdown.length - 1]?.date) }}</span>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-6 justify-center mt-6 text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800/50 pt-4">
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded bg-emerald-500" />
            <span>Court Rental Income</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded bg-rose-500" />
            <span>Outlays & Expenses</span>
          </div>
        </div>
      </div>

      <!-- Category distribution table -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Income Categories -->
        <div class="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm">
          <h4 class="font-bold text-sm text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Income Breakdown
          </h4>
          <div class="space-y-3">
            <div
              v-for="cat in report.categoryBreakdown.filter(c => c.type === 'INCOME')"
              :key="cat.category"
              class="flex justify-between items-center text-xs"
            >
              <span class="text-neutral-500 capitalize">{{ cat.category.replace('_', ' ') }}</span>
              <span class="font-semibold text-neutral-700 dark:text-neutral-300">{{ formatCurrency(cat.amount) }}</span>
            </div>
            <div
              v-if="report.categoryBreakdown.filter((c: any) => c.type === 'INCOME').length === 0"
              class="text-xs text-neutral-400 py-2"
            >
              No income transactions logged.
            </div>
          </div>
        </div>

        <!-- Expense Categories -->
        <div class="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-6 shadow-sm">
          <h4 class="font-bold text-sm text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Expense Breakdown
          </h4>
          <div class="space-y-3">
            <div
              v-for="cat in report.categoryBreakdown.filter(c => c.type === 'EXPENSE')"
              :key="cat.category"
              class="flex justify-between items-center text-xs"
            >
              <span class="text-neutral-500 capitalize">{{ cat.category.replace('_', ' ') }}</span>
              <span class="font-semibold text-neutral-700 dark:text-neutral-300">{{ formatCurrency(cat.amount) }}</span>
            </div>
            <div
              v-if="report.categoryBreakdown.filter((c: any) => c.type === 'EXPENSE').length === 0"
              class="text-xs text-neutral-400 py-2"
            >
              No expense transactions logged.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
