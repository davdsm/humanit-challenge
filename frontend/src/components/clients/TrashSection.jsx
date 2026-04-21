export function TrashSection({
  activeEntity,
  onSwitchEntity,
  trashedClients,
  trashedDocuments,
  selectedClientIds,
  selectedDocumentIds,
  allClientsSelected,
  allDocumentsSelected,
  onToggleClientSelectAll,
  onToggleDocumentSelectAll,
  onToggleClientSelection,
  onToggleDocumentSelection,
  onClearClientSelection,
  onClearDocumentSelection,
  onBulkPermanentClient,
  onBulkPermanentDocument,
  loading,
  onRestoreClient,
  onPermanentClient,
  onRestoreDocument,
  onPermanentDocument,
}) {
  const selectedCount = activeEntity === 'clients' ? selectedClientIds.size : selectedDocumentIds.size

  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-slate-200/90 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`tab-btn ${activeEntity === 'clients' ? 'tab-btn--active' : ''}`}
            onClick={() => onSwitchEntity('clients')}
            aria-pressed={activeEntity === 'clients'}
          >
            Trashed clients ({trashedClients.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeEntity === 'documents' ? 'tab-btn--active' : ''}`}
            onClick={() => onSwitchEntity('documents')}
            aria-pressed={activeEntity === 'documents'}
          >
            Trashed documents ({trashedDocuments.length})
          </button>
          {loading ? <span className="ml-2 text-xs text-slate-500">Refreshing trash…</span> : null}
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 ? (
              <>
                <span className="text-xs text-slate-600">{selectedCount} selected</span>
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  onClick={activeEntity === 'clients' ? onClearClientSelection : onClearDocumentSelection}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="btn-ghost text-xs text-rose-700"
                  onClick={activeEntity === 'clients' ? onBulkPermanentClient : onBulkPermanentDocument}
                >
                  Delete selected forever
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
      {activeEntity === 'clients' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-slate-900"
                    checked={allClientsSelected}
                    onChange={onToggleClientSelectAll}
                    aria-label="Select all trashed clients"
                  />
                </th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Deleted at</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trashedClients.map((c) => (
                <tr key={c.id} className="border-t border-slate-200/80">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-slate-900"
                      checked={selectedClientIds.has(c.id)}
                      onChange={() => onToggleClientSelection(c.id)}
                      aria-label={`Select ${c.firstName} ${c.lastName}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {c.firstName} {c.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.email}</td>
                  <td className="px-4 py-3 text-slate-600">{c.deletedAt ? new Date(c.deletedAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn-ghost text-xs" onClick={() => onRestoreClient(c)}>
                        Restore
                      </button>
                      <button type="button" className="btn-ghost text-xs text-rose-700" onClick={() => onPermanentClient(c)}>
                        Delete forever
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!trashedClients.length ? (
                <tr>
                  <td className="px-4 py-6 text-slate-600" colSpan={5}>
                    Trash is empty for clients.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-slate-900"
                    checked={allDocumentsSelected}
                    onChange={onToggleDocumentSelectAll}
                    aria-label="Select all trashed documents"
                  />
                </th>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Deleted at</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trashedDocuments.map((d) => (
                <tr key={d.id} className="border-t border-slate-200/80">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-slate-900"
                      checked={selectedDocumentIds.has(d.id)}
                      onChange={() => onToggleDocumentSelection(d.id)}
                      aria-label={`Select document ${d.originalName}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-900">{d.originalName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {d.client ? `${d.client.firstName} ${d.client.lastName}` : d.clientId}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{d.deletedAt ? new Date(d.deletedAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn-ghost text-xs" onClick={() => onRestoreDocument(d)}>
                        Restore
                      </button>
                      <button type="button" className="btn-ghost text-xs text-rose-700" onClick={() => onPermanentDocument(d)}>
                        Delete forever
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!trashedDocuments.length ? (
                <tr>
                  <td className="px-4 py-6 text-slate-600" colSpan={5}>
                    Trash is empty for documents.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
