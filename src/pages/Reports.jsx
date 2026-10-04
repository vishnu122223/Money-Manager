import { useMemo } from 'react'
import { computeTotals, formatINR, formatMonth, groupByMonth } from '../lib/transactions.js'
import { useTransactions } from '../context/TransactionsContext.js'

const HEAD =
  'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap'
const CELL = 'px-3 py-2 text-sm tabular-nums whitespace-nowrap'

const Reports = () => {
  const { transactions } = useTransactions()
  const months = useMemo(() => groupByMonth(transactions), [transactions])
  const totals = useMemo(() => computeTotals(transactions), [transactions])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="px-1 py-3 text-xl font-bold">Month by month</h2>

        {months.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No dated transactions yet — reports appear once you add some.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th scope="col" className={HEAD}>Month</th>
                  <th scope="col" className={`${HEAD} text-right`}>Income</th>
                  <th scope="col" className={`${HEAD} text-right`}>Expense</th>
                  <th scope="col" className={`${HEAD} text-right`}>Savings</th>
                  <th scope="col" className={`${HEAD} text-right`}>Net</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.month} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className={`${CELL} font-medium`}>{formatMonth(m.month)}</td>
                    <td className={`${CELL} text-right text-emerald-700`}>{formatINR(m.income)}</td>
                    <td className={`${CELL} text-right text-rose-700`}>{formatINR(m.expense)}</td>
                    <td className={`${CELL} text-right text-violet-700`}>{formatINR(m.savings)}</td>
                    <td className={`${CELL} text-right font-semibold`}>{formatINR(m.net)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td className={`${CELL} font-semibold`}>All time</td>
                  <td className={`${CELL} text-right font-semibold text-emerald-700`}>{formatINR(totals.income)}</td>
                  <td className={`${CELL} text-right font-semibold text-rose-700`}>{formatINR(totals.expense)}</td>
                  <td className={`${CELL} text-right font-semibold text-violet-700`}>{formatINR(totals.savings)}</td>
                  <td className={`${CELL} text-right font-bold`}>{formatINR(totals.balance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default Reports
