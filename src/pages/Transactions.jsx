import { useMemo, useState } from 'react'
import TransactionTable from '../components/TransactionTable.jsx'
import {
  TYPES,
  computeTotals,
  filterTransactions,
  formatINR,
  sortByDateDesc,
} from '../lib/transactions.js'
import { useTransactions } from '../context/TransactionsContext.js'

const FILTERS = ['All', ...TYPES]

const pillClass = (active) =>
  [
    'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
    active ? 'bg-blue-950 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300',
  ].join(' ')

const Transactions = () => {
  const { transactions } = useTransactions()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')

  const filtered = useMemo(
    () => sortByDateDesc(filterTransactions(transactions, { query, type })),
    [transactions, query, type],
  )
  const totals = useMemo(() => computeTotals(filtered), [filtered])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <span className="text-sm text-slate-500">
          {filtered.length} of {transactions.length} shown
        </span>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-56 flex-1">
            <label htmlFor="tx-search" className="text-sm font-semibold text-slate-700">Search</label>
            <input
              id="tx-search"
              type="search"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Search title, category or date…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button key={f} type="button" className={pillClass(type === f)} onClick={() => setType(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          <span>Income <strong className="tabular-nums">{formatINR(totals.income)}</strong></span>
          <span>Expense <strong className="tabular-nums">{formatINR(totals.expense)}</strong></span>
          <span>Savings <strong className="tabular-nums">{formatINR(totals.savings)}</strong></span>
          <span>Net <strong className="tabular-nums">{formatINR(totals.balance)}</strong></span>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <TransactionTable
          transactions={filtered}
          emptyMessage={
            transactions.length === 0
              ? 'No transactions yet — add one from the Dashboard.'
              : 'Nothing matches this search.'
          }
        />
      </section>
    </div>
  )
}

export default Transactions
