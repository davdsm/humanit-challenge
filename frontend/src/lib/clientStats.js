export function computeClientStats(clients) {
  const docCount = clients.reduce((acc, c) => acc + (c.documents?.length || 0), 0)
  const clientsWithDocs = clients.filter((c) => (c.documents?.length || 0) > 0).length
  return { clients: clients.length, documents: docCount, clientsWithDocs }
}
