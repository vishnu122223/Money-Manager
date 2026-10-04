import StatCard from './StatCard.jsx'
import { formatINR } from '../../lib/transactions.js'

const Top = ({ income, expense, savings, balance }) => (
  <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
    <h2 className="px-1 py-3 text-xl font-bold">Dashboard</h2>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Balance" value={formatINR(balance)} accent="bg-emerald-100" hint="Income − expenses − savings" />
      <StatCard label="Total Income" value={formatINR(income)} accent="bg-sky-100" />
      <StatCard label="Expense" value={formatINR(expense)} accent="bg-rose-100" />
      <StatCard label="Savings" value={formatINR(savings)} accent="bg-violet-100" />
    </div>
  </section>
)

export default Top
