import { MongoClient } from 'mongodb'

const DEFAULT_URI = 'mongodb://127.0.0.1:27017'
const DEFAULT_DB = 'money-manager'

let client = null
let db = null

export async function connectDb(options = {}) {
  const uri = options.uri || process.env.MONGODB_URI || DEFAULT_URI
  const dbName = options.dbName || process.env.MONGODB_DB || DEFAULT_DB

  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
  await client.connect()
  db = client.db(dbName)

  await Promise.all([
    db.collection('transactions').createIndex({ date: -1, createdAt: -1 }),
    db.collection('budgets').createIndex({ category: 1 }, { unique: true }),
  ])

  return db
}

export function getDb() {
  if (!db) throw new Error('Database is not connected — call connectDb() first')
  return db
}

export async function closeDb() {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}
