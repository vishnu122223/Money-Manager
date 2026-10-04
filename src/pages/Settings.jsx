import { currentMonthKey, formatMonth, newId } from '../lib/transactions.js'
import { useTransactions } from '../context/TransactionsContext.js'

const button =
  'rounded-lg px-4 py-2 text-sm font-semibold transition-colors active:scale-95'

const Settings = () => {
  const { transactions, budgets, resetAll, offline } = useTransactions()

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      month: currentMonthKey(),
      transactions,
      budgets,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `money-manager-${newId().slice(0, 8)}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    const confirmed = window.confirm(
      `Delete all ${transactions.length} transactions and every budget? This cannot be undone.`,
    )
    if (confirmed) resetAll()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="px-1 py-3 text-xl font-bold">Your data</h2>
        <dl className="space-y-2 px-1 text-sm text-slate-600">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt>Transactions stored</dt>
            <dd className="font-semibold tabular-nums">{transactions.length}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt>Category budgets set</dt>
            <dd className="font-semibold tabular-nums">{Object.keys(budgets).length}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Current period</dt>
            <dd className="font-semibold">{formatMonth(currentMonthKey())}</dd>
          </div>
        </dl>
        <p className="px-1 pt-3 text-xs text-slate-500">
          Backend:{' '}
          {offline ? (
            <span className="font-semibold text-amber-600">
              not reachable — data is kept in this browser only
            </span>
          ) : (
            <span className="font-semibold text-emerald-700">connected — data is synced to MongoDB</span>
          )}
          . Export a backup if you clear your browser data.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="px-1 py-3 text-xl font-bold">Backup &amp; reset</h2>
        <div className="flex flex-wrap gap-3 px-1">
          <button
            type="button"
            className={`${button} bg-blue-950 text-white hover:bg-blue-900`}
            onClick={handleExport}
          >
            Export data (JSON)
          </button>
          <button
            type="button"
            className={`${button} bg-rose-100 text-rose-700 hover:bg-rose-200`}
            onClick={handleReset}
            disabled={transactions.length === 0 && Object.keys(budgets).length === 0}
          >
            Reset everything
          </button>
        </div>
        <p className="px-1 pt-3 text-xs text-slate-500">
          Resetting clears local storage for this app and cannot be undone.
        </p>
      </section>
    </div>
  )
}

export default Settings
