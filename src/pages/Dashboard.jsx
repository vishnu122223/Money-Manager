import Top from './Dashboard-Top/Top.jsx'
import NewTransaction from './Dashboard-Middle/NewTransaction.jsx'
import RecentTransaction from './Dashboard-Top/Dashboard-End/RecentTransaction.jsx'
import { useTransactions } from '../context/TransactionsContext.js'

const Dashboard = () => {
  const { totals } = useTransactions()

  return (
    <div className="space-y-6">
      <Top {...totals} />
      <NewTransaction />
      <RecentTransaction />
    </div>
  )
}

export default Dashboard
