import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { connectDb, closeDb } from './db.js'

const port = Number(process.env.PORT) || 4000
const host = process.env.HOST || '127.0.0.1'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const staticDir = fs.existsSync(path.join(dist, 'index.html')) ? dist : undefined

try {
  await connectDb()
  const app = createApp({ staticDir })
  const server = app.listen(port, host, () => {
    console.log(`[api] listening on http://${host}:${port} (${process.env.MONGODB_DB || 'money-manager'})`)
  })

  const shutdown = async () => {
    server.close()
    await closeDb()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
} catch (err) {
  console.error('[api] failed to start:', err.message)
  process.exit(1)
}
