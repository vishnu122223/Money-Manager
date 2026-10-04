import TransactionTable from '../../../components/TransactionTable.jsx'
import { sortByDateDesc } from '../../../lib/transactions.js'
import { useTransactions } from '../../../context/TransactionsContext.js'

const RecentTransaction = () => {
  const { transactions } = useTransactions()
  const recent = sortByDateDesc(transactions).slice(0, 5)

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-baseline justify-between px-1 py-3">
        <h2 className="text-xl font-bold">Recent Transactions</h2>
        <span className="text-xs text-slate-500">{transactions.length} total</span>
      </div>
      <TransactionTable
        transactions={recent}
        emptyMessage="No transactions yet — add your first one above."
      />
    </section>
  )
}

export default RecentTransaction
