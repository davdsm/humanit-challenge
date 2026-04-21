function StatCard({ label, value, delay }) {
  return (
    <div className="glass-panel p-4 reveal-up" style={{ '--reveal-delay': delay }}>
      <p className="text-xs text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export function ClientStatsCards({ stats }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard label="Active clients" value={stats.clients} delay="260ms" />
      <StatCard label="Documents on file" value={stats.documents} delay="330ms" />
      <StatCard label="Clients with documents" value={stats.clientsWithDocs} delay="400ms" />
    </div>
  )
}
