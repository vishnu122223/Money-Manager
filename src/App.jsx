import { Routes, Route } from 'react-router-dom'
import Navbar from './components/navbar.jsx'
import Pages from './components/pages.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Analytics from './pages/Analytics.jsx'
import Budgets from './pages/Budgets.jsx'
import Reports from './pages/Reports.jsx'
import Transactions from './pages/Transactions.jsx'
import Settings from './pages/Settings.jsx'
import { TransactionsProvider } from './context/TransactionsProvider.jsx'

const App = () => (
  <TransactionsProvider>
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row">
        <Pages />
        <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  </TransactionsProvider>
)

export default App
