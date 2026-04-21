import { useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { computeClientStats } from '../../lib/clientStats'
import { useClientDirectory } from '../../hooks/useClientDirectory'
import { useFocusReturn } from '../../hooks/useFocusReturn'
import { useTrashBin } from '../../hooks/useTrashBin'
import { AlertBanner } from '../AlertBanner'
import { ClientModal } from './ClientModal'
import { ClientPageHeader } from './ClientPageHeader'
import { ClientStatsCards } from './ClientStatsCards'
import { ClientTable } from './ClientTable'
import { TrashSection } from './TrashSection'
import { ConfirmDialog } from '../ui/ConfirmDialog'

export function ClientDirectoryPage({ onLogout, onSessionExpired }) {
  const { clients, loading, error, setError, refresh, removeClient, bulkRemoveClients } = useClientDirectory({
    active: true,
    onUnauthorized: onSessionExpired,
  })
  const stats = useMemo(() => computeClientStats(clients), [clients])
  const [view, setView] = useState('directory')
  const [directoryDocFilter, setDirectoryDocFilter] = useState('all')
  const [trashEntity, setTrashEntity] = useState('clients')
  const {
    trashedClients,
    trashedDocuments,
    loading: trashLoading,
    error: trashError,
    setError: setTrashError,
    refresh: refreshTrash,
    restoreClient,
    permanentlyDeleteClient,
    bulkPermanentlyDeleteClients,
    restoreDocument,
    permanentlyDeleteDocument,
    bulkPermanentlyDeleteDocuments,
  } = useTrashBin({
    active: true,
    onUnauthorized: onSessionExpired,
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editing, setEditing] = useState(null)
  const [selectedClientIds, setSelectedClientIds] = useState(new Set())
  const [selectedTrashedClientIds, setSelectedTrashedClientIds] = useState(new Set())
  const [selectedTrashedDocumentIds, setSelectedTrashedDocumentIds] = useState(new Set())
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    tone: 'danger',
    action: null,
  })
  const [confirmBusy, setConfirmBusy] = useState(false)
  const { captureTrigger, restoreTrigger } = useFocusReturn()

  const allTrashedClientsSelected = trashedClients.length > 0 && trashedClients.every((c) => selectedTrashedClientIds.has(c.id))
  const allTrashedDocumentsSelected =
    trashedDocuments.length > 0 && trashedDocuments.every((d) => selectedTrashedDocumentIds.has(d.id))

  function toggleClientSelection(clientId) {
    setSelectedClientIds((prev) => {
      const next = new Set(prev)
      if (next.has(clientId)) next.delete(clientId)
      else next.add(clientId)
      return next
    })
  }

  function toggleSelectAll(clientIds = clients.map((c) => c.id)) {
    setSelectedClientIds((prev) => {
      if (clientIds.length > 0 && clientIds.every((id) => prev.has(id))) return new Set()
      return new Set(clientIds)
    })
  }

  function clearSelection() {
    setSelectedClientIds(new Set())
  }

  async function handleBulkDelete() {
    const selectedClients = clients.filter((c) => selectedClientIds.has(c.id))
    const count = selectedClients.length
    if (!count) return
    setConfirmState({
      open: true,
      title: 'Move clients to trash?',
      message: `Move ${count} selected client${count > 1 ? 's' : ''} to trash? You can restore them later.`,
      confirmLabel: 'Move to trash',
      tone: 'danger',
      action: async () => {
        await bulkRemoveClients(selectedClients)
        setSelectedClientIds(new Set())
      },
    })
  }

  function toggleTrashedClientSelection(clientId) {
    setSelectedTrashedClientIds((prev) => {
      const next = new Set(prev)
      if (next.has(clientId)) next.delete(clientId)
      else next.add(clientId)
      return next
    })
  }

  function toggleTrashedDocumentSelection(documentId) {
    setSelectedTrashedDocumentIds((prev) => {
      const next = new Set(prev)
      if (next.has(documentId)) next.delete(documentId)
      else next.add(documentId)
      return next
    })
  }

  function toggleSelectAllTrashedClients() {
    setSelectedTrashedClientIds((prev) => {
      if (trashedClients.length > 0 && trashedClients.every((c) => prev.has(c.id))) return new Set()
      return new Set(trashedClients.map((c) => c.id))
    })
  }

  function toggleSelectAllTrashedDocuments() {
    setSelectedTrashedDocumentIds((prev) => {
      if (trashedDocuments.length > 0 && trashedDocuments.every((d) => prev.has(d.id))) return new Set()
      return new Set(trashedDocuments.map((d) => d.id))
    })
  }

  function clearTrashedClientSelection() {
    setSelectedTrashedClientIds(new Set())
  }

  function clearTrashedDocumentSelection() {
    setSelectedTrashedDocumentIds(new Set())
  }

  async function handleBulkPermanentDeleteClients() {
    const selectedClients = trashedClients.filter((c) => selectedTrashedClientIds.has(c.id))
    const count = selectedClients.length
    if (!count) return
    setConfirmState({
      open: true,
      title: 'Delete clients forever?',
      message: `Permanently delete ${count} client${count > 1 ? 's' : ''}? This cannot be undone.`,
      confirmLabel: 'Delete forever',
      tone: 'danger',
      action: async () => {
        await bulkPermanentlyDeleteClients(selectedClients)
        setSelectedTrashedClientIds(new Set())
        await refresh()
      },
    })
  }

  async function handleBulkPermanentDeleteDocuments() {
    const selectedDocuments = trashedDocuments.filter((d) => selectedTrashedDocumentIds.has(d.id))
    const count = selectedDocuments.length
    if (!count) return
    setConfirmState({
      open: true,
      title: 'Delete documents forever?',
      message: `Permanently delete ${count} document${count > 1 ? 's' : ''}? This removes files from trash.`,
      confirmLabel: 'Delete forever',
      tone: 'danger',
      action: async () => {
        await bulkPermanentlyDeleteDocuments(selectedDocuments)
        setSelectedTrashedDocumentIds(new Set())
        await refresh()
      },
    })
  }

  function closeConfirm(force = false) {
    if (confirmBusy && !force) return
    setConfirmState((prev) => ({ ...prev, open: false, action: null }))
  }

  async function runConfirm() {
    if (!confirmState.action) return closeConfirm()
    setConfirmBusy(true)
    try {
      await confirmState.action()
      closeConfirm(true)
    } finally {
      setConfirmBusy(false)
    }
  }

  function openCreateModal() {
    captureTrigger()
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }

  function openEditModal(client) {
    captureTrigger()
    setModalMode('edit')
    setEditing(client)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    restoreTrigger()
  }

  async function handleLogout() {
    try {
      await api.logout()
    } catch {
      // ignore
    }
    onLogout()
  }

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="reveal-up" style={{ '--reveal-delay': '80ms' }}>
        <ClientPageHeader
          view={view}
          onSwitchView={setView}
          onAddClient={openCreateModal}
          onRefresh={view === 'directory' ? refresh : refreshTrash}
          loading={view === 'directory' ? loading : trashLoading}
          trashCount={trashedClients.length + trashedDocuments.length}
          onLogout={handleLogout}
        />
      </div>

      <div className="reveal-up" style={{ '--reveal-delay': '170ms' }}>
        <AlertBanner message={view === 'directory' ? error : trashError} />
      </div>

      <main aria-label="Client overview and directory">
        {view === 'directory' ? (
          <>
            <div className="reveal-up" style={{ '--reveal-delay': '240ms' }}>
              <ClientStatsCards stats={stats} activeFilter={directoryDocFilter} onSelectFilter={setDirectoryDocFilter} />
            </div>
            <div className="mt-6 reveal-up" style={{ '--reveal-delay': '330ms' }}>
              <ClientTable
                clients={clients}
                selectedIds={selectedClientIds}
                onSelectAllToggle={toggleSelectAll}
                onSelectToggle={toggleClientSelection}
                onClearSelection={clearSelection}
                onBulkDelete={handleBulkDelete}
                onEdit={openEditModal}
                docFilter={directoryDocFilter}
                onDocFilterChange={setDirectoryDocFilter}
                onDelete={(client) => {
                  const name = `${client.firstName} ${client.lastName}`.trim()
                  setConfirmState({
                    open: true,
                    title: 'Move client to trash?',
                    message: `Move ${name} to trash? You can restore it later from Trash.`,
                    confirmLabel: 'Move to trash',
                    tone: 'danger',
                    action: async () => {
                      await removeClient(client)
                    },
                  })
                }}
              />
            </div>
          </>
        ) : (
          <div className="reveal-up mt-4" style={{ '--reveal-delay': '240ms' }}>
            <TrashSection
              activeEntity={trashEntity}
              onSwitchEntity={setTrashEntity}
              trashedClients={trashedClients}
              trashedDocuments={trashedDocuments}
              selectedClientIds={selectedTrashedClientIds}
              selectedDocumentIds={selectedTrashedDocumentIds}
              allClientsSelected={allTrashedClientsSelected}
              allDocumentsSelected={allTrashedDocumentsSelected}
              onToggleClientSelectAll={toggleSelectAllTrashedClients}
              onToggleDocumentSelectAll={toggleSelectAllTrashedDocuments}
              onToggleClientSelection={toggleTrashedClientSelection}
              onToggleDocumentSelection={toggleTrashedDocumentSelection}
              onClearClientSelection={clearTrashedClientSelection}
              onClearDocumentSelection={clearTrashedDocumentSelection}
              onBulkPermanentClient={handleBulkPermanentDeleteClients}
              onBulkPermanentDocument={handleBulkPermanentDeleteDocuments}
              loading={trashLoading}
              onRestoreClient={async (client) => {
                await restoreClient(client)
                setError('')
                await refresh()
              }}
              onPermanentClient={(client) => {
                const name = `${client.firstName} ${client.lastName}`.trim()
                setConfirmState({
                  open: true,
                  title: 'Delete client forever?',
                  message: `Permanently delete ${name}? This cannot be undone and files will be removed.`,
                  confirmLabel: 'Delete forever',
                  tone: 'danger',
                  action: async () => {
                    await permanentlyDeleteClient(client)
                  },
                })
              }}
              onRestoreDocument={async (doc) => {
                await restoreDocument(doc)
                setError('')
                await refresh()
              }}
              onPermanentDocument={(doc) => {
                setConfirmState({
                  open: true,
                  title: 'Delete document forever?',
                  message: `Permanently delete document "${doc.originalName}"? This removes the file from trash.`,
                  confirmLabel: 'Delete forever',
                  tone: 'danger',
                  action: async () => {
                    await permanentlyDeleteDocument(doc)
                  },
                })
              }}
            />
          </div>
        )}
      </main>

      <ClientModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        onClose={closeModal}
        onSaved={async () => {
          setError('')
          setTrashError('')
          await refresh()
          await refreshTrash()
        }}
      />
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        tone={confirmState.tone}
        busy={confirmBusy}
        onCancel={closeConfirm}
        onConfirm={runConfirm}
      />
    </div>
  )
}
