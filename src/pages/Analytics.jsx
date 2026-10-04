import { useMemo } from 'react'
import StatCard from './Dashboard-Top/StatCard.jsx'
import {
  categoryBreakdown,
  categoryTotalsForMonth,
  computeTotals,
  currentMonthKey,
  formatINR,
  formatMonth,
} from '../lib/transactions.js'
import { useTransactions } from '../context/TransactionsContext.js'

const Analytics = () => {
  const { transactions } = useTransactions()
  const month = currentMonthKey()

  const allTime = useMemo(() => computeTotals(transactions), [transactions])
  const monthTotals = useMemo(
    () => computeTotals(transactions.filter((t) => t.date && t.date.startsWith(month))),
    [transactions, month],
  )
  const expenses = useMemo(() => categoryBreakdown(transactions, 'Expense'), [transactions])
  const monthExpenses = useMemo(() => categoryTotalsForMonth(transactions, month), [transactions, month])

  const rate = allTime.income > 0 ? Math.round((allTime.savings / allTime.income) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <span className="text-sm text-slate-500">{formatMonth(month)} to date</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="All-time income" value={formatINR(allTime.income)} accent="bg-sky-100" />
        <StatCard label="All-time expenses" value={formatINR(allTime.expense)} accent="bg-rose-100" />
        <StatCard
          label="Savings rate"
          value={`${rate}%`}
          accent="bg-violet-100"
          hint={`of income kept`}
        />
        <StatCard
          label={`${formatMonth(month)} expenses`}
          value={formatINR(monthTotals.expense)}
          accent="bg-amber-100"
        />
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="px-1 py-3 text-xl font-bold">Where the money goes</h2>
        <p className="px-1 pb-4 text-sm text-slate-500">All-time expenses split by category.</p>

        {expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No expenses recorded yet — add a transaction with type “Expense”.
          </p>
        ) : (
          <div className="space-y-4 px-1">
            {expenses.map((row) => (
              <div key={row.category}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{row.category}</span>
                  <span className="tabular-nums text-slate-600">
                    {formatINR(row.total)} · {row.share}%
                  </span>
                </div>
                <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-3 rounded-full bg-blue-600" style={{ width: `${row.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="px-1 py-3 text-xl font-bold">Top categories this month</h2>
        {monthExpenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Nothing spent yet in {formatMonth(month)}.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 px-1">
            {monthExpenses.map((row, index) => (
              <li key={row.category} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium">
                  <span className="mr-3 text-slate-400">{index + 1}.</span>
                  {row.category}
                </span>
                <span className="tabular-nums">{formatINR(row.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default Analytics
