import express from 'express'
import path from 'node:path'
import { ObjectId } from 'mongodb'
import { getDb } from './db.js'
import { CATEGORIES, TYPES, parseAmount } from '../src/lib/transactions.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const serialize = (doc) => ({
  id: doc._id.toString(),
  title: doc.title,
  amount: doc.amount,
  category: doc.category,
  type: doc.type,
  date: doc.date,
  createdAt: doc.createdAt,
})

/** Validate an incoming payload; returns { error } or { value } with only valid fields. */
function validate(body) {
  const source = body && typeof body === 'object' ? body : {}
  const value = {}

  if (source.title !== undefined) {
    const title = String(source.title).trim()
    if (!title) return { error: 'Title cannot be empty.' }
    value.title = title
  }
  if (source.amount !== undefined) {
    const amount = parseAmount(source.amount)
    if (amount === null) return { error: 'Amount must be a number greater than 0.' }
    value.amount = amount
  }
  if (source.date !== undefined) {
    if (!DATE_RE.test(String(source.date))) return { error: 'Date must be YYYY-MM-DD.' }
    value.date = source.date
  }
  if (source.category !== undefined) {
    if (!CATEGORIES.includes(source.category)) return { error: `Unknown category: ${source.category}.` }
    value.category = source.category
  }
  if (source.type !== undefined) {
    if (!TYPES.includes(source.type)) return { error: `Unknown type: ${source.type}.` }
    value.type = source.type
  }

  return { value }
}

const route = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next)
}

const parseId = (raw) => (ObjectId.isValid(raw) ? new ObjectId(raw) : null)

export function createApp(options = {}) {
  const app = express()
  app.use(express.json())

  app.get('/api/health', (req, res) => {
    getDb()
    res.json({ ok: true, db: 'connected' })
  })

  app.get(
    '/api/transactions',
    route(async (req, res) => {
      const docs = await getDb()
        .collection('transactions')
        .find()
        .sort({ date: -1, createdAt: -1 })
        .toArray()
      res.json(docs.map(serialize))
    }),
  )

  app.post(
    '/api/transactions',
    route(async (req, res) => {
      const { error, value } = validate(req.body)
      if (error) return res.status(400).json({ error })

      const missing = ['title', 'amount', 'date', 'category', 'type'].find((k) => value[k] === undefined)
      if (missing) return res.status(400).json({ error: `Missing field: ${missing}.` })

      const doc = { ...value, createdAt: Date.now() }
      const result = await getDb().collection('transactions').insertOne(doc)
      res.status(201).json(serialize({ ...doc, _id: result.insertedId }))
    }),
  )

  app.patch(
    '/api/transactions/:id',
    route(async (req, res) => {
      const id = parseId(req.params.id)
      if (!id) return res.status(404).json({ error: 'Transaction not found.' })

      const { error, value } = validate(req.body)
      if (error) return res.status(400).json({ error })
      if (Object.keys(value).length === 0) return res.status(400).json({ error: 'Nothing to update.' })

      const updated = await getDb()
        .collection('transactions')
        .findOneAndUpdate({ _id: id }, { $set: value }, { returnDocument: 'after' })

      if (!updated) return res.status(404).json({ error: 'Transaction not found.' })
      res.json(serialize(updated))
    }),
  )

  app.delete(
    '/api/transactions/:id',
    route(async (req, res) => {
      const id = parseId(req.params.id)
      if (!id) return res.status(404).json({ error: 'Transaction not found.' })

      const result = await getDb().collection('transactions').deleteOne({ _id: id })
      if (result.deletedCount === 0) return res.status(404).json({ error: 'Transaction not found.' })
      res.json({ ok: true, id: req.params.id })
    }),
  )

  app.get(
    '/api/budgets',
    route(async (req, res) => {
      const docs = await getDb().collection('budgets').find().toArray()
      const budgets = Object.fromEntries(docs.map((d) => [d.category, d.amount]))
      res.json(budgets)
    }),
  )

  app.put(
    '/api/budgets/:category',
    route(async (req, res) => {
      const { category } = req.params
      if (!CATEGORIES.includes(category)) return res.status(400).json({ error: `Unknown category: ${category}.` })

      const amount = Number(req.body && req.body.amount)
      const collection = getDb().collection('budgets')

      if (!Number.isFinite(amount) || amount <= 0) {
        await collection.deleteOne({ category })
        return res.json({ ok: true, category, amount: null })
      }

      await collection.updateOne({ category }, { $set: { category, amount } }, { upsert: true })
      res.json({ ok: true, category, amount })
    }),
  )

  app.delete(
    '/api/data',
    route(async (req, res) => {
      const db = getDb()
      const [tx, budgets] = await Promise.all([
        db.collection('transactions').deleteMany({}),
        db.collection('budgets').deleteMany({}),
      ])
      res.json({ ok: true, deleted: tx.deletedCount + budgets.deletedCount })
    }),
  )

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }))

  // Optional: serve the built frontend from this same process, so production is one server.
  // Registered after the API so JSON 404s keep taking priority over the SPA fallback.
  if (options.staticDir) {
    const indexHtml = path.join(options.staticDir, 'index.html')
    app.use(express.static(options.staticDir))
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
      res.sendFile(indexHtml, (err) => {
        if (err) next(err)
      })
    })
  }

  app.use((err, req, res, next) => {
    console.error('[api]', err)
    if (res.headersSent) return next(err)
    res.status(500).json({ error: 'Server error.' })
  })

  return app
}
