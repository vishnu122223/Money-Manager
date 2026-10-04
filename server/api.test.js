import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'

import { createApp } from './app.js'
import { connectDb, closeDb, getDb } from './db.js'

const TEST_DB = 'money-manager-test'

let server
let base

const call = async (path, options = {}) => {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

const sampleTransaction = (overrides = {}) => ({
  title: 'Lunch',
  amount: 250,
  date: '2026-10-04',
  category: 'Food',
  type: 'Expense',
  ...overrides,
})

before(async () => {
  await connectDb({ dbName: TEST_DB })
  await getDb().collection('transactions').deleteMany({})
  await getDb().collection('budgets').deleteMany({})

  server = createApp().listen(0)
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
  await getDb().collection('transactions').deleteMany({})
  await getDb().collection('budgets').deleteMany({})
  await closeDb()
})

test('health endpoint reports the database connection', async () => {
  const { status, body } = await call('/api/health')
  assert.equal(status, 200)
  assert.deepEqual(body, { ok: true, db: 'connected' })
})

test('rejects a transaction with a non-numeric amount', async () => {
  const { status, body } = await call('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(sampleTransaction({ amount: 'abc' })),
  })
  assert.equal(status, 400)
  assert.match(body.error, /Amount must be a number/)
})

test('rejects a transaction missing required fields', async () => {
  const { status, body } = await call('/api/transactions', {
    method: 'POST',
    body: JSON.stringify({ title: 'No date' }),
  })
  assert.equal(status, 400)
  assert.match(body.error, /Missing field/)
})

test('creates a valid transaction and returns it with an id', async () => {
  const { status, body } = await call('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(sampleTransaction()),
  })
  assert.equal(status, 201)
  assert.ok(body.id, 'expected an id')
  assert.equal(body.amount, 250)
  assert.equal(body.title, 'Lunch')
  assert.equal(typeof body.createdAt, 'number')
})

test('lists transactions newest first', async () => {
  await call('/api/transactions', { method: 'POST', body: JSON.stringify(sampleTransaction({ title: 'Older', date: '2026-09-01' })) })
  await call('/api/transactions', { method: 'POST', body: JSON.stringify(sampleTransaction({ title: 'Newer', date: '2026-10-05' })) })

  const { status, body } = await call('/api/transactions')
  assert.equal(status, 200)
  assert.ok(body.length >= 3)
  assert.equal(body[0].title, 'Newer')
  for (const t of body) assert.ok(t.id && t.title && t.amount)
})

test('updates a transaction with PATCH', async () => {
  const created = (await call('/api/transactions', { method: 'POST', body: JSON.stringify(sampleTransaction({ title: 'To edit' })) })).body

  const { status, body } = await call(`/api/transactions/${created.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ amount: 999.5, title: 'Edited' }),
  })
  assert.equal(status, 200)
  assert.equal(body.amount, 999.5)
  assert.equal(body.title, 'Edited')

  const list = (await call('/api/transactions')).body
  assert.ok(list.some((t) => t.id === created.id && t.amount === 999.5))
})

test('PATCH with an invalid id or payload fails cleanly', async () => {
  const badId = await call('/api/transactions/not-an-objectid', { method: 'PATCH', body: JSON.stringify({ amount: 10 }) })
  assert.equal(badId.status, 404)

  const created = (await call('/api/transactions', { method: 'POST', body: JSON.stringify(sampleTransaction()) })).body
  const badAmount = await call(`/api/transactions/${created.id}`, { method: 'PATCH', body: JSON.stringify({ amount: -3 }) })
  assert.equal(badAmount.status, 400)
})

test('deletes a transaction and reports a missing one', async () => {
  const created = (await call('/api/transactions', { method: 'POST', body: JSON.stringify(sampleTransaction({ title: 'Doomed' })) })).body

  const deleted = await call(`/api/transactions/${created.id}`, { method: 'DELETE' })
  assert.equal(deleted.status, 200)

  const again = await call(`/api/transactions/${created.id}`, { method: 'DELETE' })
  assert.equal(again.status, 404)

  const list = (await call('/api/transactions')).body
  assert.ok(!list.some((t) => t.id === created.id))
})

test('budgets can be set, read and cleared per category', async () => {
  const set = await call('/api/budgets/Food', { method: 'PUT', body: JSON.stringify({ amount: 5000 }) })
  assert.equal(set.status, 200)
  assert.equal(set.body.amount, 5000)

  const read = await call('/api/budgets')
  assert.equal(read.body.Food, 5000)

  const unknown = await call('/api/budgets/Nonsense', { method: 'PUT', body: JSON.stringify({ amount: 10 }) })
  assert.equal(unknown.status, 400)

  const cleared = await call('/api/budgets/Food', { method: 'PUT', body: JSON.stringify({ amount: 0 }) })
  assert.equal(cleared.body.amount, null)
  const after = await call('/api/budgets')
  assert.equal(after.body.Food, undefined)
})

test('DELETE /api/data clears everything', async () => {
  await call('/api/transactions', { method: 'POST', body: JSON.stringify(sampleTransaction()) })
  await call('/api/budgets/Bills', { method: 'PUT', body: JSON.stringify({ amount: 2000 }) })

  const { status, body } = await call('/api/data', { method: 'DELETE' })
  assert.equal(status, 200)
  assert.ok(body.deleted >= 2)

  assert.equal((await call('/api/transactions')).body.length, 0)
  assert.deepEqual((await call('/api/budgets')).body, {})
})
