import { ClientTableRow } from './ClientTableRow'

export function ClientTable({
  clients,
  selectedIds,
  allSelected,
  onSelectAllToggle,
  onSelectToggle,
  onClearSelection,
  onBulkDelete,
  onEdit,
  onDelete,
}) {
  const selectedCount = selectedIds.size

  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-slate-200/90 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700">Your clients</p>
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
                  checked={allSelected}
                  onChange={onSelectAllToggle}
                  aria-label="Select all clients"
                />
              </th>
              <th scope="col" className="px-4 py-3">
                Name
              </th>
              <th scope="col" className="px-4 py-3">
                Email
              </th>
              <th scope="col" className="px-4 py-3">
                Tax ID
              </th>
              <th scope="col" className="px-4 py-3">
                Docs
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c, index) => (
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
            {!clients.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-600/50" colSpan={6}>
                  No clients yet. Use &quot;Add client&quot; to create your first record and start tracking documents and
                  renewal dates.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
