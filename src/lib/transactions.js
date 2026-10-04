export const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Hobby', 'Work', 'Other']
export const TYPES = ['Expense', 'Income', 'Savings']

/**
 * Parse a user supplied amount into a positive number.
 * Accepts "1250", "1,250.50", "₹1250", 1250.
 * Returns null when the value is not a usable amount (empty, letters, negative, zero).
 */
export function parseAmount(raw) {
  if (raw === null || raw === undefined) return null
  const cleaned = String(raw).replace(/[₹,\s]/g, '')
  if (!/^\d*\.?\d+$/.test(cleaned)) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

export function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Defensive number coercion so a corrupt record can never poison totals with NaN. */
function toAmount(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function computeTotals(transactions) {
  const sumOf = (type) =>
    transactions.filter((t) => t.type === type).reduce((total, t) => total + toAmount(t.amount), 0)

  const income = sumOf('Income')
  const expense = sumOf('Expense')
  const savings = sumOf('Savings')

  return {
    income: round2(income),
    expense: round2(expense),
    savings: round2(savings),
    balance: round2(income - expense - savings),
  }
}

export function monthKey(date) {
  const match = /^(\d{4}-\d{2})/.exec(String(date || ''))
  return match ? match[1] : ''
}

export function currentMonthKey(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
}

export function todayISO(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function formatMonth(key) {
  const [year, month] = String(key).split('-')
  if (!year || !month) return key
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  })
}

export function formatINR(value) {
  const n = Number(value)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)
}

/** Breakdown of one transaction type by category, largest first, with share percentages. */
export function categoryBreakdown(transactions, type = 'Expense') {
  const totals = new Map()
  for (const t of transactions) {
    if (t.type !== type) continue
    const category = t.category || 'Other'
    totals.set(category, (totals.get(category) || 0) + toAmount(t.amount))
  }

  const sum = [...totals.values()].reduce((a, b) => a + b, 0)

  return [...totals.entries()]
    .map(([category, total]) => ({
      category,
      total: round2(total),
      share: sum ? round2((total / sum) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

export function categoryTotalsForMonth(transactions, month) {
  return categoryBreakdown(transactions.filter((t) => monthKey(t.date) === month))
}

/** Newest first, using the date then the creation time as a tiebreaker. */
export function sortByDateDesc(transactions) {
  return [...transactions].sort(
    (a, b) =>
      String(b.date || '').localeCompare(String(a.date || '')) ||
      (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0),
  )
}

export function filterTransactions(transactions, { query = '', type = 'All' } = {}) {
  const q = query.trim().toLowerCase()
  return transactions.filter((t) => {
    if (type !== 'All' && t.type !== type) return false
    if (!q) return true
    return [t.title, t.category, t.date].some((field) =>
      String(field || '').toLowerCase().includes(q),
    )
  })
}

/** Per-month income/expense/savings/net, newest month first. */
export function groupByMonth(transactions) {
  const buckets = new Map()

  for (const t of transactions) {
    const key = monthKey(t.date)
    if (!key) continue
    if (!buckets.has(key)) buckets.set(key, { month: key, income: 0, expense: 0, savings: 0 })
    const bucket = buckets.get(key)
    if (t.type === 'Income') bucket.income += toAmount(t.amount)
    else if (t.type === 'Expense') bucket.expense += toAmount(t.amount)
    else if (t.type === 'Savings') bucket.savings += toAmount(t.amount)
  }

  return [...buckets.values()]
    .map((b) => ({
      ...b,
      income: round2(b.income),
      expense: round2(b.expense),
      savings: round2(b.savings),
      net: round2(b.income - b.expense - b.savings),
    }))
    .sort((a, b) => b.month.localeCompare(a.month))
}

export function newId() {
  if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
    return `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
  return crypto.randomUUID()
}
