import { formatBytes } from './formatBytes'

const GENERIC =
  'Something went wrong on our side. Please try again in a moment. If it keeps happening, contact support.'

export function getFriendlyErrorMessage(error, context = 'generic') {
  if (!error) return GENERIC
  const status = error.status
  const code = error.code || error.body?.error?.code

  if (context === 'login') {
    if (code === 'INVALID_CREDENTIALS' || status === 401) {
      return 'That email or password does not match our records. Please check your details and try again.'
    }
    if (status === 429) return 'Too many sign-in attempts. Please wait a moment and try again.'
    if (status >= 500) return 'The sign-in service is temporarily unavailable. Please try again shortly.'
    return 'We could not sign you in right now. Please check your connection and try again.'
  }

  if (context === 'upload') {
    if (code === 'CLIENT_IN_TRASH' || (status === 409 && /client is in trash/i.test(error.message || ''))) {
      return 'This document cannot be restored because its client is still in Trash. Restore the client first, then restore this document.'
    }
    if (code === 'PAYLOAD_TOO_LARGE' || status === 413) {
      return 'This file is larger than the upload limit. Please choose a smaller file and try again.'
    }
    if (code === 'VALIDATION_ERROR' || status === 400) {
      return 'This file could not be uploaded. Check the file type, expiration date, and notes, then try again.'
    }
    if (status === 401) return 'Your session expired while uploading. Please sign in again.'
    return 'We could not upload that file right now. Please try again.'
  }

  if (context === 'client-list') {
    if (status === 401) return 'Your session expired. Please sign in again.'
    if (status >= 500) return 'Client data is temporarily unavailable. Please refresh in a moment.'
    return 'We could not load your client list. Please refresh and try again.'
  }

  if (context === 'client-delete') {
    if (status === 404) return 'This client no longer exists. Your list will refresh now.'
    if (status === 409) return 'This client cannot be deleted right now because of a data conflict.'
    return 'We could not delete this client right now. Please try again.'
  }

  if (context === 'client-save') {
    if (status === 409 || code === 'CONFLICT') {
      return 'A client with the same email or tax ID already exists. Please use unique values.'
    }
    if (status === 400 || code === 'VALIDATION_ERROR') {
      return 'Some details are invalid. Please review the form and try again.'
    }
    if (status === 401) return 'Your session expired. Please sign in again before saving.'
    return 'We could not save this client right now. Please try again.'
  }

  return error.message || GENERIC
}

export function buildMaxFileSizeMessage(maxBytes) {
  return `This file is too large. The maximum allowed size is ${formatBytes(maxBytes)}.`
}
