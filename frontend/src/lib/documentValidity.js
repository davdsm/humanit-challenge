export function getDocumentValidity(doc) {
  let status = doc?.validityStatus
  let daysToExpire = Number(doc?.daysToExpire)

  if (!status) {
    const exp = new Date(doc?.expirationDate || '')
    if (!Number.isNaN(exp.getTime())) {
      const expUtc = Date.UTC(exp.getUTCFullYear(), exp.getUTCMonth(), exp.getUTCDate())
      const now = new Date()
      const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      daysToExpire = Math.floor((expUtc - todayUtc) / 86400000)
      status = daysToExpire < 0 ? 'EXPIRED' : daysToExpire <= 30 ? 'EXPIRING_SOON' : 'VALID'
    }
  }

  if (status === 'EXPIRED') return { label: 'Expired', tone: 'danger' }
  if (status === 'EXPIRING_SOON') {
    if (Number.isFinite(daysToExpire) && daysToExpire >= 0) {
      return { label: `Expires in ${daysToExpire} day${daysToExpire === 1 ? '' : 's'}`, tone: 'warning' }
    }
    return { label: 'Expiring soon', tone: 'warning' }
  }
  return { label: 'Valid', tone: 'ok' }
}

export function getClientDocumentsBadge(documents = []) {
  if (!documents.length) return { label: 'No docs', tone: 'neutral' }

  const states = documents.map(getDocumentValidity)
  if (states.some((s) => s.tone === 'danger')) return { label: 'Expired docs', tone: 'danger' }
  if (states.some((s) => s.tone === 'warning')) return { label: 'Expiring soon', tone: 'warning' }
  return { label: 'All valid', tone: 'ok' }
}
