import { useState } from 'react'
import { CATEGORIES, TYPES, parseAmount, todayISO } from '../../lib/transactions.js'
import { useTransactions } from '../../context/TransactionsContext.js'

const FIELD =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'
const LABEL = 'text-sm font-semibold text-slate-700'

const emptyForm = () => ({
  title: '',
  amount: '',
  category: 'Food',
  type: 'Expense',
  date: todayISO(),
})

const NewTransaction = () => {
  const { addTransaction } = useTransactions()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
    setSaved('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const amount = parseAmount(form.amount)
    if (!form.title.trim()) {
      setError('Please enter a title.')
      return
    }
    if (amount === null) {
      setError('Amount must be a number greater than 0.')
      return
    }
    if (!form.date) {
      setError('Please choose a date.')
      return
    }

    addTransaction({ ...form, title: form.title.trim(), amount })
    setError('')
    setSaved(`Added “${form.title.trim()}”.`)
    setForm((prev) => ({ ...prev, title: '', amount: '' }))
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="px-1 py-3 text-xl font-bold">Add New Transaction</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 px-1 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="tx-title" className={LABEL}>Title</label>
          <input
            id="tx-title"
            type="text"
            className={FIELD}
            placeholder="e.g. Lunch, Salary, Uber"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="tx-amount" className={LABEL}>Amount (₹)</label>
          <input
            id="tx-amount"
            type="text"
            inputMode="decimal"
            className={FIELD}
            placeholder="e.g. 250"
            value={form.amount}
            onChange={(e) => setField('amount', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="tx-date" className={LABEL}>Date</label>
          <input
            id="tx-date"
            type="date"
            className={FIELD}
            value={form.date}
            onChange={(e) => setField('date', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="tx-category" className={LABEL}>Category</label>
          <select
            id="tx-category"
            className={FIELD}
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="tx-type" className={LABEL}>Type</label>
          <select
            id="tx-type"
            className={FIELD}
            value={form.type}
            onChange={(e) => setField('type', e.target.value)}
          >
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 active:scale-95"
          >
            + Add Transaction
          </button>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-rose-600 sm:col-span-2 lg:col-span-3">{error}</p>
        ) : saved ? (
          <p role="status" className="text-sm text-emerald-700 sm:col-span-2 lg:col-span-3">{saved}</p>
        ) : null}
      </form>
    </section>
  )
}

export default NewTransaction
