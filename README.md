# Advanced Expense Tracker (money-manager)

A React expense tracker with a Node/Express + MongoDB backend: record income, expenses and
savings, watch your balance update live, set per-category monthly budgets, and review
month-by-month reports — with your data stored in MongoDB instead of only the browser.

## Features

- **Dashboard** — balance, income, expense and savings cards with a validated
  "add transaction" form (non-numeric or zero amounts are rejected, never `NaN`)
- **Transactions** — full list with search, type filters and inline edit/delete
- **Analytics** — all-time and month-to-date totals plus an expense breakdown by category
- **Budgets** — set a monthly limit per category and track progress (green → amber → red)
- **Reports** — per-month income/expense/savings/net table with all-time totals
- **Settings** — backend connection status, JSON export, reset everything
- **Backend** — REST API backed by MongoDB, with a localStorage cache so the app still
  works when the API is down (offline mode), and automatic first-run migration of
  existing browser data into MongoDB
- Responsive: usable from ~360 px phones up to wide desktops

## Stack

- [React 19](https://react.dev) + [Vite 8](https://vite.dev) + [React Router 7](https://reactrouter.com)
- [Tailwind CSS 4](https://tailwindcss.com) (via `@tailwindcss/vite`)
- [Express 5](https://expressjs.com) + the official [MongoDB Node driver](https://www.mongodb.com/docs/drivers/node/)
- [Oxlint](https://oxc.rs) for linting; Node's built-in test runner for tests

## Requirements

- Node 20+
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or point `MONGODB_URI` at any MongoDB)

## Scripts

```bash
npm install       # install dependencies
npm run dev:all   # API + frontend together (recommended)
npm run server    # API only on http://localhost:4000
npm run dev       # frontend only (Vite, proxies /api to :4000)
npm run build     # production build
npm run lint      # oxlint
npm test          # money-math unit tests + API integration tests
```

### Production

`npm run build && npm run server` serves the whole app — static frontend **and** the API —
from one process at `http://127.0.0.1:4000`. (`npm run preview` is Vite's frontend-only
preview; without a proxy it runs in offline mode against the localStorage cache.)

## Backend API

All routes are JSON and are proxied to the frontend under `/api`.

| Method | Route                      | Purpose                                  |
| ------ | -------------------------- | ---------------------------------------- |
| GET    | `/api/health`              | liveness + database connection           |
| GET    | `/api/transactions`        | list transactions, newest first          |
| POST   | `/api/transactions`        | create (validates title, amount, date…)  |
| PATCH  | `/api/transactions/:id`    | partial update                           |
| DELETE | `/api/transactions/:id`    | delete one                               |
| GET    | `/api/budgets`             | all category budgets                     |
| PUT    | `/api/budgets/:category`   | set a budget (`amount <= 0` clears it)   |
| DELETE | `/api/data`                | wipe transactions and budgets            |

Environment variables (all optional): `PORT` (4000), `MONGODB_URI`, `MONGODB_DB`
(`money-manager`), `API_TARGET` (Vite proxy target, defaults to `http://localhost:4000`).

The frontend calls the API first and keeps a `localStorage` copy as a cache; if the backend
is unreachable it runs in offline mode against the cache and shows that in Settings. When
the backend is empty but the browser has data, the data is migrated up on first load.

The API binds to `127.0.0.1` by default (there is no authentication), so it is not reachable
from other machines. Set `HOST=0.0.0.0` only after you have added auth in front of it.

## Project layout

```
server/
  index.js             API entry point (connect + listen)
  app.js               Express app: routes, validation, error handling
  db.js                MongoDB connection, indexes
  api.test.js          integration tests (money-manager-test database)
scripts/dev.js         zero-dependency launcher for API + Vite together
src/
  lib/transactions.js  pure helpers: validation, totals, grouping (+ unit tests)
  lib/api.js           fetch wrapper for the REST API
  context/             app state: API-first sync with localStorage fallback
  components/          navbar, sidebar nav, shared TransactionTable
  pages/               one file per route
```
