const StatCard = ({ label, value, accent = 'bg-white', hint }) => (
  <div className={`rounded-2xl border border-slate-200 p-4 shadow-sm ${accent}`}>
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">{label}</p>
    <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
  </div>
)

export default StatCard
