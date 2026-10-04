import { useState } from 'react'
import { CATEGORIES, TYPES, formatINR, parseAmount } from '../lib/transactions.js'
import { useTransactions } from '../context/TransactionsContext.js'

const CELL = 'px-3 py-2 text-sm align-middle'
const HEAD = `${CELL} text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap`

const TYPE_STYLES = {
  Expense: 'bg-rose-100 text-rose-700',
  Income: 'bg-emerald-100 text-emerald-700',
  Savings: 'bg-violet-100 text-violet-700',
}

const INPUT =
  'w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none'

const actionButton =
  'rounded-md px-2 py-1 text-xs font-semibold active:scale-95 disabled:opacity-40'

const TransactionTable = ({ transactions, editable = true, emptyMessage = 'No transactions yet.' }) => {
  const { updateTransaction, removeTransaction } = useTransactions()
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')

  const startEdit = (t) => {
    setEditingId(t.id)
    setDraft({ ...t, amount: String(t.amount) })
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft(null)
    setError('')
  }

  const saveEdit = () => {
    const amount = parseAmount(draft.amount)
    if (!String(draft.title).trim()) {
      setError('Title cannot be empty.')
      return
    }
    if (amount === null) {
      setError('Amount must be a number greater than 0.')
      return
    }
    updateTransaction(editingId, { ...draft, title: String(draft.title).trim(), amount })
    cancelEdit()
  }

  const setField = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }))

  if (transactions.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{emptyMessage}</p>
  }

  return (
    <div>
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th scope="col" className={HEAD}>Date</th>
              <th scope="col" className={HEAD}>Title</th>
              <th scope="col" className={HEAD}>Category</th>
              <th scope="col" className={HEAD}>Type</th>
              <th scope="col" className={`${HEAD} text-right`}>Amount</th>
              {editable ? <th scope="col" className={`${HEAD} text-right`}>Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const isEditing = editingId === t.id
              if (!isEditing) {
                return (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className={`${CELL} whitespace-nowrap text-slate-600`}>{t.date}</td>
                    <td className={`${CELL} font-medium`}>{t.title}</td>
                    <td className={CELL}>{t.category}</td>
                    <td className={CELL}>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_STYLES[t.type] || 'bg-slate-100 text-slate-600'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`${CELL} text-right font-semibold tabular-nums`}>{formatINR(t.amount)}</td>
                    {editable ? (
                      <td className={`${CELL} text-right whitespace-nowrap`}>
                        <button
                          type="button"
                          className={`${actionButton} bg-blue-100 text-blue-700 hover:bg-blue-200`}
                          onClick={() => startEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`${actionButton} ml-2 bg-rose-100 text-rose-700 hover:bg-rose-200`}
                          onClick={() => removeTransaction(t.id)}
                        >
                          Delete
                        </button>
                      </td>
                    ) : null}
                  </tr>
                )
              }

              return (
                <tr key={t.id} className="border-b border-slate-100 bg-blue-50/60">
                  <td className={CELL}>
                    <input
                      type="date"
                      className={INPUT}
                      value={draft.date}
                      onChange={(e) => setField('date', e.target.value)}
                    />
                  </td>
                  <td className={CELL}>
                    <input
                      type="text"
                      className={INPUT}
                      value={draft.title}
                      onChange={(e) => setField('title', e.target.value)}
                    />
                  </td>
                  <td className={CELL}>
                    <select
                      className={INPUT}
                      value={draft.category}
                      onChange={(e) => setField('category', e.target.value)}
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className={CELL}>
                    <select
                      className={INPUT}
                      value={draft.type}
                      onChange={(e) => setField('type', e.target.value)}
                    >
                      {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className={CELL}>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`${INPUT} text-right tabular-nums`}
                      value={draft.amount}
                      onChange={(e) => setField('amount', e.target.value)}
                    />
                  </td>
                  <td className={`${CELL} text-right whitespace-nowrap`}>
                    <button
                      type="button"
                      className={`${actionButton} bg-emerald-200 text-emerald-800 hover:bg-emerald-300`}
                      onClick={saveEdit}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className={`${actionButton} ml-2 bg-slate-200 text-slate-700 hover:bg-slate-300`}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>
      ) : null}
    </div>
  )
}

export default TransactionTable
