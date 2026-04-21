import { getClientDocumentsBadge } from './documentValidity'

export function computeClientStats(clients) {
  const docCount = clients.reduce((acc, c) => acc + (c.documents?.length || 0), 0)
  const clientsWithDocs = clients.filter((c) => (c.documents?.length || 0) > 0).length
  const clientsWithExpiredDocs = clients.filter((c) => getClientDocumentsBadge(c.documents || []).tone === 'danger').length
  const clientsWithExpiringDocs = clients.filter((c) => getClientDocumentsBadge(c.documents || []).tone === 'warning').length
  return { clients: clients.length, documents: docCount, clientsWithDocs, clientsWithExpiredDocs, clientsWithExpiringDocs }
}
