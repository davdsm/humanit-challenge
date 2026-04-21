async function parseJsonSafe(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

function createApiError(res, body, fallbackMessage) {
  const message = body?.error?.message || body?.message || res.statusText || fallbackMessage
  const err = new Error(message)
  err.status = res.status
  err.body = body
  err.code = body?.error?.code
  err.requestId = body?.error?.requestId
  return err
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })
  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw createApiError(res, body, 'Request failed')
  }
  return body
}

/** Multipart upload (do not set Content-Type; browser sets boundary). */
export async function apiUpload(path, formData) {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw createApiError(res, body, 'Upload failed')
  }
  return body
}

export function documentDownloadUrl(clientId, documentId) {
  return `/api/clients/${clientId}/documents/${documentId}/download`
}

export const api = {
  health: () => apiFetch('/api/health'),
  login: (payload) =>
    apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: () =>
    apiFetch('/api/auth/logout', {
      method: 'POST',
    }),
  listClients: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return apiFetch(`/api/clients${q ? `?${q}` : ''}`)
  },
  getClient: (id) => apiFetch(`/api/clients/${id}`),
  createClient: (payload) =>
    apiFetch('/api/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateClient: (id, payload) =>
    apiFetch(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteClient: (id) =>
    apiFetch(`/api/clients/${id}`, {
      method: 'DELETE',
    }),
  listTrashedClients: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return apiFetch(`/api/clients/trash${q ? `?${q}` : ''}`)
  },
  restoreClient: (clientId) =>
    apiFetch(`/api/clients/${clientId}/restore`, {
      method: 'POST',
    }),
  permanentlyDeleteClient: (clientId) =>
    apiFetch(`/api/clients/${clientId}/permanent`, {
      method: 'DELETE',
    }),
  uploadDocument: (clientId, formData) => apiUpload(`/api/clients/${clientId}/documents`, formData),
  updateDocumentMeta: (clientId, documentId, payload) =>
    apiFetch(`/api/clients/${clientId}/documents/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteDocument: (clientId, documentId) =>
    apiFetch(`/api/clients/${clientId}/documents/${documentId}`, {
      method: 'DELETE',
    }),
  listTrashedDocuments: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return apiFetch(`/api/clients/documents/trash${q ? `?${q}` : ''}`)
  },
  restoreDocument: (documentId) =>
    apiFetch(`/api/clients/documents/${documentId}/restore`, {
      method: 'POST',
    }),
  permanentlyDeleteDocument: (documentId) =>
    apiFetch(`/api/clients/documents/${documentId}/permanent`, {
      method: 'DELETE',
    }),
}
