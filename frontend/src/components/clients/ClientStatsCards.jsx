function StatCard({ label, value, delay, active = false, onClick }) {
  return (
    <button
      type="button"
      className={`glass-panel w-full p-4 text-left reveal-up transition-colors ${active ? 'border-slate-900 ring-1 ring-slate-900/10' : 'hover:bg-slate-50'}`}
      style={{ '--reveal-delay': delay }}
      onClick={onClick}
    >
      <p className="text-xs text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </button>
  )
}

export function ClientStatsCards({ stats, activeFilter = 'all', onSelectFilter }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard label="Active clients" value={stats.clients} delay="260ms" active={activeFilter === 'all'} onClick={() => onSelectFilter?.('all')} />
      <StatCard
        label="Clients with expired docs"
        value={stats.clientsWithExpiredDocs}
        delay="330ms"
        active={activeFilter === 'expired'}
        onClick={() => onSelectFilter?.('expired')}
      />
      <StatCard
        label="Clients with expiring docs"
        value={stats.clientsWithExpiringDocs}
        delay="400ms"
        active={activeFilter === 'expiring'}
        onClick={() => onSelectFilter?.('expiring')}
      />
    </div>
  )
}
