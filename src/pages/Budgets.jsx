import { useMemo } from 'react'
import { CATEGORIES, categoryTotalsForMonth, currentMonthKey, formatINR, formatMonth } from '../lib/transactions.js'
import { useTransactions } from '../context/TransactionsContext.js'

const BAR_TRACK = 'mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200'
const BAR_FILL = 'h-3 rounded-full transition-all'

const progressClass = (pct) => {
  if (pct >= 100) return `${BAR_FILL} bg-rose-500`
  if (pct >= 80) return `${BAR_FILL} bg-amber-500`
  return `${BAR_FILL} bg-emerald-500`
}

const Budgets = () => {
  const { transactions, budgets, setBudget } = useTransactions()
  const month = currentMonthKey()

  const spentRows = useMemo(() => categoryTotalsForMonth(transactions, month), [transactions, month])
  const spentByCategory = useMemo(
    () => Object.fromEntries(spentRows.map((row) => [row.category, row.total])),
    [spentRows],
  )

  const rows = CATEGORIES.map((category) => {
    const spent = spentByCategory[category] || 0
    const budget = Number(budgets[category]) || 0
    const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0
    return { category, spent, budget, pct }
  })

  const budgetedTotal = rows.reduce((sum, r) => sum + r.budget, 0)
  const spentTotal = rows.reduce((sum, r) => sum + r.spent, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <span className="text-sm text-slate-500">For {formatMonth(month)}</span>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap gap-x-8 gap-y-1 px-1 pb-4 text-sm text-slate-600">
          <span>Spent <strong className="tabular-nums">{formatINR(spentTotal)}</strong></span>
          <span>Budgeted <strong className="tabular-nums">{formatINR(budgetedTotal)}</strong></span>
          <span>
            Remaining{' '}
            <strong className="tabular-nums">{formatINR(budgetedTotal - spentTotal)}</strong>
          </span>
        </div>

        <div className="space-y-5">
          {rows.map(({ category, spent, budget, pct }) => (
            <div key={category}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold">{category}</span>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums text-slate-600">
                    {formatINR(spent)}
                    {budget > 0 ? ` of ${formatINR(budget)}` : ''}
                  </span>
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <span className="sr-only">{category} monthly budget</span>
                    ₹
                    <input
                      type="number"
                      min="0"
                      step="100"
                      className="w-24 rounded-md border border-slate-300 px-2 py-1 text-right tabular-nums focus:border-blue-500 focus:outline-none"
                      placeholder="budget"
                      value={budgets[category] ?? ''}
                      onChange={(e) => setBudget(category, e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className={BAR_TRACK}>
                <div className={progressClass(pct)} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>

              <p className="mt-1 text-xs text-slate-500">
                {budget <= 0
                  ? 'No budget set yet.'
                  : spent > budget
                    ? `Over budget by ${formatINR(spent - budget)}.`
                    : `${pct}% used · ${formatINR(budget - spent)} left`}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Budgets
