import { toDateInputValue } from './dates'

export function emptyDocumentRow() {
  return {
    id: undefined,
    file: null,
    originalName: '',
    description: '',
    expirationDate: '',
    mimeType: undefined,
    sizeBytes: undefined,
  }
}

export function emptyClientForm() {
  return {
    firstName: '',
    lastName: '',
    taxIdentifier: '',
    email: '',
    phoneNumber: '',
    documents: [emptyDocumentRow()],
    removedDocumentIds: [],
  }
}

/** Map API client to local form state (date fields as yyyy-mm-dd). */
export function clientToFormState(client) {
  if (!client) return emptyClientForm()
  const docs = client.documents?.length
    ? client.documents.map((d) => ({
        id: d.id,
        file: null,
        originalName: d.originalName || '',
        description: d.description ?? '',
        expirationDate: toDateInputValue(d.expirationDate),
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
      }))
    : [emptyDocumentRow()]
  return {
    firstName: client.firstName,
    lastName: client.lastName,
    taxIdentifier: client.taxIdentifier,
    email: client.email,
    phoneNumber: client.phoneNumber,
    documents: docs,
    removedDocumentIds: [],
  }
}

/** Profile fields only (documents are uploaded via separate endpoints). */
export function formToClientProfilePayload(form) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    taxIdentifier: form.taxIdentifier.trim(),
    email: form.email.trim(),
    phoneNumber: form.phoneNumber.trim(),
  }
}

/** JSON body for create/update client (profile only). */
export const formToApiPayload = formToClientProfilePayload
