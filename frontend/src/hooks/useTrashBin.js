import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getFriendlyErrorMessage } from '../lib/errorMessages'

export function useTrashBin({ active, onUnauthorized }) {
  const [trashedClients, setTrashedClients] = useState([])
  const [trashedDocuments, setTrashedDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [clientsRes, docsRes] = await Promise.all([
        api.listTrashedClients({ page: 1, limit: 100 }),
        api.listTrashedDocuments({ page: 1, limit: 200 }),
      ])
      setTrashedClients(clientsRes.items || [])
      setTrashedDocuments(docsRes.items || [])
    } catch (e) {
      if (e.status === 401) onUnauthorized?.()
      else setError(getFriendlyErrorMessage(e, 'client-list'))
    } finally {
      setLoading(false)
    }
  }, [onUnauthorized])

  useEffect(() => {
    if (!active) return
    queueMicrotask(() => {
      void refresh()
    })
  }, [active, refresh])

  const restoreClient = useCallback(
    async (client) => {
      try {
        await api.restoreClient(client.id)
        await refresh()
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'client-save'))
      }
    },
    [refresh],
  )

  const permanentlyDeleteClient = useCallback(
    async (client) => {
      try {
        await api.permanentlyDeleteClient(client.id)
        await refresh()
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'client-delete'))
      }
    },
    [refresh],
  )

  const bulkPermanentlyDeleteClients = useCallback(
    async (clients) => {
      if (!clients.length) return
      try {
        await Promise.all(clients.map((client) => api.permanentlyDeleteClient(client.id)))
        await refresh()
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'client-delete'))
      }
    },
    [refresh],
  )

  const restoreDocument = useCallback(
    async (doc) => {
      try {
        await api.restoreDocument(doc.id)
        await refresh()
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'upload'))
      }
    },
    [refresh],
  )

  const permanentlyDeleteDocument = useCallback(
    async (doc) => {
      try {
        await api.permanentlyDeleteDocument(doc.id)
        await refresh()
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'upload'))
      }
    },
    [refresh],
  )

  const bulkPermanentlyDeleteDocuments = useCallback(
    async (documents) => {
      if (!documents.length) return
      try {
        await Promise.all(documents.map((doc) => api.permanentlyDeleteDocument(doc.id)))
        await refresh()
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'upload'))
      }
    },
    [refresh],
  )

  return {
    trashedClients,
    trashedDocuments,
    loading,
    error,
    setError,
    refresh,
    restoreClient,
    permanentlyDeleteClient,
    bulkPermanentlyDeleteClients,
    restoreDocument,
    permanentlyDeleteDocument,
    bulkPermanentlyDeleteDocuments,
  }
}
