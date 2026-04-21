import { toDateInputValue } from './dates'
import { DEFAULT_PHONE_DIAL_CODE, PHONE_COUNTRIES } from '../constants/phoneCountries'

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
    phoneDialCode: DEFAULT_PHONE_DIAL_CODE,
    phoneLocalNumber: '',
    documents: [emptyDocumentRow()],
    removedDocumentIds: [],
  }
}

function parsePhoneNumber(phoneNumber = '') {
  const raw = String(phoneNumber || '').trim()
  if (!raw) return { phoneDialCode: DEFAULT_PHONE_DIAL_CODE, phoneLocalNumber: '' }

  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)
  const match = sorted.find((c) => raw.startsWith(c.dialCode))
  if (!match) return { phoneDialCode: DEFAULT_PHONE_DIAL_CODE, phoneLocalNumber: raw }

  const rest = raw.slice(match.dialCode.length).trim().replace(/^\-+/, '').trim()
  return { phoneDialCode: match.dialCode, phoneLocalNumber: rest }
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
  const parsedPhone = parsePhoneNumber(client.phoneNumber)
  return {
    firstName: client.firstName,
    lastName: client.lastName,
    taxIdentifier: client.taxIdentifier,
    email: client.email,
    phoneNumber: client.phoneNumber,
    phoneDialCode: parsedPhone.phoneDialCode,
    phoneLocalNumber: parsedPhone.phoneLocalNumber,
    documents: docs,
    removedDocumentIds: [],
  }
}

/** Profile fields only (documents are uploaded via separate endpoints). */
export function formToClientProfilePayload(form) {
  const dial = String(form.phoneDialCode || DEFAULT_PHONE_DIAL_CODE).trim()
  const local = String(form.phoneLocalNumber || '').trim()
  const phoneNumber = local ? `${dial} ${local}`.trim() : dial

  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    taxIdentifier: form.taxIdentifier.trim(),
    email: form.email.trim(),
    phoneNumber,
  }
}

/** JSON body for create/update client (profile only). */
export const formToApiPayload = formToClientProfilePayload
