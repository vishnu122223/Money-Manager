import test from 'node:test'
import assert from 'node:assert/strict'

import {
  parseAmount,
  computeTotals,
  categoryBreakdown,
  categoryTotalsForMonth,
  filterTransactions,
  groupByMonth,
  monthKey,
  todayISO,
  formatMonth,
  formatINR,
} from './transactions.js'

test('parseAmount accepts plain, grouped and currency-prefixed numbers', () => {
  assert.equal(parseAmount('1250'), 1250)
  assert.equal(parseAmount('1,250.50'), 1250.5)
  assert.equal(parseAmount('₹999'), 999)
  assert.equal(parseAmount(' 42 '), 42)
  assert.equal(parseAmount('.5'), 0.5)
  assert.equal(parseAmount(100), 100)
})

test('parseAmount rejects empty, non-numeric, zero and negative values', () => {
  assert.equal(parseAmount(''), null)
  assert.equal(parseAmount('   '), null)
  assert.equal(parseAmount('abc'), null)
  assert.equal(parseAmount('12abc'), null)
  assert.equal(parseAmount('-5'), null)
  assert.equal(parseAmount('0'), null)
  assert.equal(parseAmount('0.00'), null)
  assert.equal(parseAmount('12.'), null)
  assert.equal(parseAmount(null), null)
  assert.equal(parseAmount(undefined), null)
})

test('computeTotals derives balance and ignores malformed amounts', () => {
  const transactions = [
    { type: 'Income', amount: 50000 },
    { type: 'Expense', amount: '12000' },
    { type: 'Expense', amount: 'not-a-number' },
    { type: 'Savings', amount: 8000 },
    { type: 'Income', amount: 2000 },
  ]

  const totals = computeTotals(transactions)
  assert.equal(totals.income, 52000)
  assert.equal(totals.expense, 12000)
  assert.equal(totals.savings, 8000)
  assert.equal(totals.balance, 32000)
  assert.ok(Object.values(totals).every((v) => Number.isFinite(v)))
})

test('computeTotals on an empty list is all zeros', () => {
  assert.deepEqual(computeTotals([]), { income: 0, expense: 0, savings: 0, balance: 0 })
})

test('categoryBreakdown sorts by size and reports shares that add up to 100', () => {
  const transactions = [
    { type: 'Expense', category: 'Food', amount: 600 },
    { type: 'Expense', category: 'Travel', amount: 300 },
    { type: 'Expense', category: 'Food', amount: 100 },
    { type: 'Income', category: 'Food', amount: 9999 },
    { type: 'Expense', category: 'Bills', amount: 0 },
  ]

  const rows = categoryBreakdown(transactions)
  assert.deepEqual(rows.map((r) => r.category), ['Food', 'Travel', 'Bills'])
  assert.equal(rows[0].total, 700)
  assert.equal(rows[0].share, 70)
  assert.equal(rows[1].share, 30)
  assert.equal(rows[2].share, 0)
  assert.equal(
    rows.reduce((sum, r) => sum + r.share, 0),
    100,
  )
})

test('categoryTotalsForMonth only counts the requested month', () => {
  const transactions = [
    { type: 'Expense', category: 'Food', amount: 100, date: '2026-10-04' },
    { type: 'Expense', category: 'Food', amount: 500, date: '2026-09-30' },
    { type: 'Expense', category: 'Travel', amount: 250, date: '2026-10-01' },
  ]

  const rows = categoryTotalsForMonth(transactions, '2026-10')
  assert.deepEqual(rows, [
    { category: 'Travel', total: 250, share: 71.43 },
    { category: 'Food', total: 100, share: 28.57 },
  ])
})

test('filterTransactions filters by type and searches title, category and date', () => {
  const transactions = [
    { id: 1, type: 'Expense', title: 'Lunch', category: 'Food', date: '2026-10-01' },
    { id: 2, type: 'Income', title: 'Salary', category: 'Work', date: '2026-10-02' },
    { id: 3, type: 'Expense', title: 'Uber', category: 'Travel', date: '2026-10-03' },
  ]

  assert.equal(filterTransactions(transactions, { type: 'Expense' }).length, 2)
  assert.deepEqual(
    filterTransactions(transactions, { query: 'sala' }).map((t) => t.id),
    [2],
  )
  assert.deepEqual(
    filterTransactions(transactions, { query: 'travel' }).map((t) => t.id),
    [3],
  )
  assert.deepEqual(
    filterTransactions(transactions, { query: '2026-10-01' }).map((t) => t.id),
    [1],
  )
  assert.equal(filterTransactions(transactions, {}).length, 3)
})

test('groupByMonth returns newest month first with a net per month', () => {
  const transactions = [
    { type: 'Income', amount: 1000, date: '2026-09-05' },
    { type: 'Expense', amount: 400, date: '2026-09-06' },
    { type: 'Expense', amount: 250, date: '2026-10-02' },
    { type: 'Savings', amount: 100, date: '2026-10-03' },
    { type: 'Expense', amount: 99, date: 'not-a-date' },
  ]

  const months = groupByMonth(transactions)
  assert.deepEqual(
    months.map((m) => m.month),
    ['2026-10', '2026-09'],
  )
  assert.deepEqual(months[0], {
    month: '2026-10',
    income: 0,
    expense: 250,
    savings: 100,
    net: -350,
  })
  assert.equal(months[1].net, 600)
})

test('monthKey and todayISO produce YYYY-MM and YYYY-MM-DD', () => {
  assert.equal(monthKey('2026-10-04'), '2026-10')
  assert.equal(monthKey('2026-10'), '2026-10')
  assert.equal(monthKey('junk'), '')
  assert.match(todayISO(new Date(2026, 0, 4)), /^2026-01-04$/)
})

test('formatters render readable labels and never NaN', () => {
  assert.equal(formatMonth('2026-10'), 'Oct 2026')
  assert.equal(formatINR(1234), '₹1,234')
  assert.equal(formatINR(1234.5), '₹1,234.5')
  assert.equal(formatINR(NaN), '₹0')
  assert.equal(formatINR(undefined), '₹0')
})
