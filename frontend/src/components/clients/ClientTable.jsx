import { useMemo, useState } from 'react'
import { getClientDocumentsBadge } from '../../lib/documentValidity'
import { ClientTableRow } from './ClientTableRow'

export function ClientTable({
  clients,
  selectedIds,
  onSelectAllToggle,
  onSelectToggle,
  onClearSelection,
  onBulkDelete,
  onEdit,
  onDelete,
  docFilter = 'all',
  onDocFilterChange,
}) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  const visibleClients = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = clients.filter((c) => {
      const badge = getClientDocumentsBadge(c.documents || [])
      const matchesQuery =
        !q ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.taxIdentifier || '').toLowerCase().includes(q)
      const matchesStatus =
        docFilter === 'all' ||
        (docFilter === 'expired' && badge.tone === 'danger') ||
        (docFilter === 'expiring' && badge.tone === 'warning') ||
        (docFilter === 'valid' && badge.tone === 'ok') ||
        (docFilter === 'none' && badge.tone === 'neutral')
      return matchesQuery && matchesStatus
    })

    const sorted = [...filtered].sort((a, b) => {
      const factor = sortDir === 'asc' ? 1 : -1
      if (sortBy === 'email') return (a.email || '').localeCompare(b.email || '') * factor
      if (sortBy === 'taxIdentifier') return (a.taxIdentifier || '').localeCompare(b.taxIdentifier || '') * factor
      if (sortBy === 'documents') return ((a.documents?.length || 0) - (b.documents?.length || 0)) * factor
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`) * factor
    })

    return sorted
  }, [clients, query, docFilter, sortBy, sortDir])

  const allVisibleSelected = visibleClients.length > 0 && visibleClients.every((c) => selectedIds.has(c.id))
  const selectedCount = selectedIds.size

  function handleSort(nextSortBy) {
    if (sortBy === nextSortBy) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortBy(nextSortBy)
    setSortDir('asc')
  }

  function sortArrow(column) {
    if (sortBy !== column) return <span className="ml-1 text-slate-400">↕</span>
    return <span className="ml-1 text-slate-700">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-slate-200/90 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-700">Your clients</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              className="field h-9 w-56 py-1 text-xs"
              placeholder="Search name, email, tax ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="field h-9 w-44 py-1 text-xs"
              value={docFilter}
              onChange={(e) => onDocFilterChange?.(e.target.value)}
            >
              <option value="all">All document states</option>
              <option value="expired">Expired docs</option>
              <option value="expiring">Expiring soon</option>
              <option value="valid">All valid</option>
              <option value="none">No docs</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 ? (
              <>
                <span className="text-xs text-slate-600">{selectedCount} selected</span>
                <button type="button" className="btn-ghost text-xs" onClick={onClearSelection}>
                  Clear
                </button>
                <button type="button" className="btn-ghost text-xs text-rose-700" onClick={onBulkDelete}>
                  Delete selected
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">
            Directory of clients with email, tax identifier, document counts, and row actions.
          </caption>
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-slate-900"
                  checked={allVisibleSelected}
                  onChange={() => onSelectAllToggle(visibleClients.map((c) => c.id))}
                  aria-label="Select all clients"
                />
              </th>
              <th scope="col" className="px-4 py-3">
                <button type="button" className="inline-flex items-center text-left" onClick={() => handleSort('name')}>
                  Name
                  {sortArrow('name')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button type="button" className="inline-flex items-center text-left" onClick={() => handleSort('email')}>
                  Email
                  {sortArrow('email')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button type="button" className="inline-flex items-center text-left" onClick={() => handleSort('taxIdentifier')}>
                  Tax ID
                  {sortArrow('taxIdentifier')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button type="button" className="inline-flex items-center text-left" onClick={() => handleSort('documents')}>
                  Docs
                  {sortArrow('documents')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleClients.map((c, index) => (
              <ClientTableRow
                key={c.id}
                client={c}
                rowIndex={index}
                selected={selectedIds.has(c.id)}
                onSelectToggle={onSelectToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {!visibleClients.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-600/50" colSpan={6}>
                  No clients match your current search/filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
