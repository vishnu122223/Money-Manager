import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TransactionsContext } from './TransactionsContext.js'
import { computeTotals, newId } from '../lib/transactions.js'
import { api } from '../lib/api.js'

const TRANSACTIONS_KEY = 'money-manager.transactions.v1'
const BUDGETS_KEY = 'money-manager.budgets.v1'

function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be unavailable (private mode, quota). The app still works in memory.
  }
}

/** A 4xx/5xx response means the backend answered — only network failures mean it is gone. */
const isOutage = (err) => err.status === undefined || err.status >= 500

const toPayload = (input) => ({
  title: String(input.title || '').trim(),
  amount: Number(input.amount),
  category: input.category || 'Other',
  type: input.type || 'Expense',
  date: input.date || '',
})

const toLocalRecord = (input) => ({
  id: newId(),
  ...toPayload(input),
  createdAt: Date.now(),
})

export const TransactionsProvider = ({ children }) => {
  const [transactions, setTransactions] = useState(() => {
    const stored = readStorage(TRANSACTIONS_KEY, [])
    return Array.isArray(stored) ? stored : []
  })
  const [budgets, setBudgets] = useState(() => {
    const stored = readStorage(BUDGETS_KEY, {})
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
  })
  const [offline, setOffline] = useState(false)

  const offlineRef = useRef(offline)
  const transactionsRef = useRef(transactions)
  const budgetsRef = useRef(budgets)

  useEffect(() => {
    offlineRef.current = offline
  }, [offline])
  useEffect(() => {
    transactionsRef.current = transactions
  }, [transactions])
  useEffect(() => {
    budgetsRef.current = budgets
  }, [budgets])

  // The local cache keeps the app instant (and usable without the backend);
  // the server is authoritative once it answers.
  useEffect(() => writeStorage(TRANSACTIONS_KEY, transactions), [transactions])
  useEffect(() => writeStorage(BUDGETS_KEY, budgets), [budgets])

  // Initial sync. If the backend is empty but this browser already has data, migrate it up
  // so switching from localStorage to MongoDB never loses what the user entered.
  useEffect(() => {
    let cancelled = false

    const sync = async () => {
      try {
        const [serverTransactions, serverBudgets] = await Promise.all([
          api.listTransactions(),
          api.listBudgets(),
        ])
        if (cancelled) return

        const cached = transactionsRef.current
        const cachedBudgets = budgetsRef.current
        const emptyBackend = serverTransactions.length === 0 && cached.length > 0
        const migrateBudgets =
          Object.keys(serverBudgets).length === 0 && Object.keys(cachedBudgets).length > 0

        if (emptyBackend) {
          const ordered = [...cached].sort((a, b) => String(a.date).localeCompare(String(b.date)))
          const created = []
          for (const t of ordered) {
            created.push(
              await api.createTransaction({
                title: t.title,
                amount: t.amount,
                category: t.category,
                type: t.type,
                date: t.date,
              }),
            )
          }
          if (cancelled) return
          setTransactions(created)
        } else {
          setTransactions(serverTransactions)
        }

        if (migrateBudgets) {
          for (const [category, amount] of Object.entries(cachedBudgets)) {
            await api.setBudget(category, amount)
          }
          if (cancelled) return
          setBudgets(cachedBudgets)
        } else {
          setBudgets(serverBudgets)
        }

        setOffline(false)
      } catch (err) {
        if (!cancelled && isOutage(err)) setOffline(true)
      }
    }

    sync()
    return () => {
      cancelled = true
    }
  }, [])

  const addTransaction = useCallback(async (input) => {
    const payload = toPayload(input)

    if (!offlineRef.current) {
      try {
        const created = await api.createTransaction(payload)
        setTransactions((prev) => [...prev, created])
        return created
      } catch (err) {
        if (!isOutage(err)) throw err
        setOffline(true)
      }
    }

    const local = toLocalRecord(payload)
    setTransactions((prev) => [...prev, local])
    return local
  }, [])

  const updateTransaction = useCallback((id, patch) => {
    const clean = { ...patch }
    if (clean.amount !== undefined) clean.amount = Number(clean.amount)
    if (clean.title !== undefined) clean.title = String(clean.title).trim()

    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...clean } : t)))

    if (offlineRef.current) return Promise.resolve()
    return api.updateTransaction(id, clean).then(
      (updated) => setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t))),
      (err) => {
        if (isOutage(err)) setOffline(true)
      },
    )
  }, [])

  const removeTransaction = useCallback((id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))

    if (offlineRef.current) return Promise.resolve()
    return api.deleteTransaction(id).catch((err) => {
      if (isOutage(err)) setOffline(true)
    })
  }, [])

  const setBudget = useCallback((category, amount) => {
    const value = Number(amount)
    setBudgets((prev) => {
      const next = { ...prev }
      if (amount === null || amount === undefined || amount === '' || !Number.isFinite(value) || value <= 0) {
        delete next[category]
      } else {
        next[category] = value
      }
      return next
    })

    if (offlineRef.current) return Promise.resolve()
    return api.setBudget(category, value).catch((err) => {
      if (isOutage(err)) setOffline(true)
    })
  }, [])

  const resetAll = useCallback(() => {
    setTransactions([])
    setBudgets({})

    if (offlineRef.current) return Promise.resolve()
    return api.clearAll().catch((err) => {
      if (isOutage(err)) setOffline(true)
    })
  }, [])

  const value = useMemo(
    () => ({
      transactions,
      budgets,
      offline,
      totals: computeTotals(transactions),
      addTransaction,
      updateTransaction,
      removeTransaction,
      resetAll,
      setBudget,
    }),
    [
      transactions,
      budgets,
      offline,
      addTransaction,
      updateTransaction,
      removeTransaction,
      resetAll,
      setBudget,
    ],
  )

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>
}
