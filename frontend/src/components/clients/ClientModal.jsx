import { useEffect, useRef, useState } from 'react'
import { MAX_UPLOAD_BYTES } from '../../constants/upload'
import { api } from '../../lib/api'
import { clientToFormState, emptyClientForm, emptyDocumentRow, formToClientProfilePayload } from '../../lib/clientForm'
import { dateInputToIsoUtc } from '../../lib/dates'
import { buildMaxFileSizeMessage, getFriendlyErrorMessage } from '../../lib/errorMessages'
import { DocumentEditor } from '../documents/DocumentEditor'
import { FormError } from '../FormError'
import { ClientFormFields } from './ClientFormFields'

export function ClientModal({ open, mode, initial, onClose, onSaved }) {
  const [form, setForm] = useState(emptyClientForm())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [documentErrors, setDocumentErrors] = useState([])
  const [fileInputResetKey, setFileInputResetKey] = useState(0)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    queueMicrotask(() => {
      setError('')
      setFieldErrors({})
      setDocumentErrors([])
      setFileInputResetKey((value) => value + 1)
      setForm(mode === 'edit' && initial ? clientToFormState(initial) : emptyClientForm())
    })
  }, [open, mode, initial])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [open])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    function handleClose() {
      onClose()
    }
    el.addEventListener('close', handleClose)
    return () => el.removeEventListener('close', handleClose)
  }, [onClose])

  function requestClose() {
    dialogRef.current?.close()
  }

  function setDocuments(docs) {
    setDocumentErrors([])
    setForm((prev) => ({
      ...prev,
      documents: docs.length ? docs : [emptyDocumentRow()],
    }))
  }

  function validate() {
    const nextFieldErrors = {}
    if (!form.firstName.trim()) nextFieldErrors.firstName = 'First name is required.'
    if (!form.lastName.trim()) nextFieldErrors.lastName = 'Last name is required.'
    if (!form.taxIdentifier.trim()) nextFieldErrors.taxIdentifier = 'Tax ID is required.'
    if (!form.email.trim()) nextFieldErrors.email = 'Email is required.'
    if (!form.phoneNumber.trim()) nextFieldErrors.phoneNumber = 'Phone number is required.'

    const nextDocumentErrors = form.documents.map(() => ({}))
    for (let i = 0; i < form.documents.length; i += 1) {
      const row = form.documents[i]
      if (row.id && !row.expirationDate) nextDocumentErrors[i].expirationDate = 'Expiration date is required.'
      if (row.file && !row.expirationDate) nextDocumentErrors[i].expirationDate = 'Expiration date is required.'
      if (!row.id && !row.file && row.expirationDate) nextDocumentErrors[i].file = 'Please choose a file.'
      if (row.file && row.file.size > MAX_UPLOAD_BYTES) nextDocumentErrors[i].file = buildMaxFileSizeMessage(MAX_UPLOAD_BYTES)
    }

    setFieldErrors(nextFieldErrors)
    setDocumentErrors(nextDocumentErrors)
    return Object.keys(nextFieldErrors).length === 0 && nextDocumentErrors.every((x) => Object.keys(x).length === 0)
  }

  function handleRemoveRow(index, row) {
    setForm((prev) => {
      const removed = row?.id ? [...prev.removedDocumentIds, row.id] : prev.removedDocumentIds
      const next = prev.documents.filter((_, i) => i !== index)
      return {
        ...prev,
        removedDocumentIds: removed,
        documents: next.length ? next : [emptyDocumentRow()],
      }
    })
  }

  async function submit(e) {
    e.preventDefault()
    if (!validate()) return
    setBusy(true)
    setError('')
    try {
      for (const row of form.documents) {
        if (row.id && !row.expirationDate) {
          setError('Add an expiration date for every saved file.')
          setBusy(false)
          return
        }
        if (row.file && !row.expirationDate) {
          setError('Add an expiration date for every file you upload.')
          setBusy(false)
          return
        }
        if (row.file && row.file.size > MAX_UPLOAD_BYTES) {
          setError(buildMaxFileSizeMessage(MAX_UPLOAD_BYTES))
          setBusy(false)
          return
        }
        if (!row.id && !row.file && (row.expirationDate || (row.description && row.description.trim()))) {
          setError('Remove incomplete rows or choose a file for each row with a date or notes.')
          setBusy(false)
          return
        }
      }

      const profile = formToClientProfilePayload(form)

      if (mode === 'create') {
        const created = await api.createClient(profile)
        for (const row of form.documents) {
          if (row.file && row.expirationDate) {
            const fd = new FormData()
            fd.append('file', row.file)
            fd.append('expirationDate', dateInputToIsoUtc(row.expirationDate))
            if (row.description?.trim()) fd.append('description', row.description.trim())
            await api.uploadDocument(created.id, fd)
          }
        }
      } else {
        await api.updateClient(initial.id, profile)
        for (const id of form.removedDocumentIds) {
          await api.deleteDocument(initial.id, id)
        }
        for (const row of form.documents) {
          if (row.id) {
            await api.updateDocumentMeta(initial.id, row.id, {
              expirationDate: dateInputToIsoUtc(row.expirationDate),
              description: row.description?.trim() ? row.description.trim() : null,
            })
          } else if (row.file && row.expirationDate) {
            const fd = new FormData()
            fd.append('file', row.file)
            fd.append('expirationDate', dateInputToIsoUtc(row.expirationDate))
            if (row.description?.trim()) fd.append('description', row.description.trim())
            await api.uploadDocument(initial.id, fd)
          }
        }
      }
      await onSaved?.()
      requestClose()
    } catch (err) {
      const context = err.status === 413 || err.code === 'PAYLOAD_TOO_LARGE' ? 'upload' : 'client-save'
      setError(getFriendlyErrorMessage(err, context))
    } finally {
      setBusy(false)
    }
  }

  const titleId = 'client-modal-title'
  const helpId = 'client-modal-help'
  const heading = mode === 'create' ? 'Add a new client' : 'Edit client profile'
  const eyebrow = mode === 'create' ? 'New client' : 'Edit profile'
  const clientIdForDocs = mode === 'edit' && initial?.id ? initial.id : null

  return (
    <dialog
      ref={dialogRef}
      className="morph-dialog glass-panel max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6"
      aria-labelledby={titleId}
      aria-describedby={helpId}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#9be5f0]">{eyebrow}</p>
          <h2 id={titleId} className="mt-2 text-2xl font-semibold text-slate-900" tabIndex={-1}>
            {heading}
          </h2>
          <p id={helpId} className="mt-1 text-sm text-slate-600">
            {mode === 'create'
              ? 'When you save, the profile is created first, then each chosen file is uploaded securely with its expiry date.'
              : 'Update contact details, add new files, or adjust expiry and notes. Tax ID cannot be changed after the record is created.'}
          </p>
        </div>
        <button type="button" className="btn-ghost text-xs" onClick={requestClose}>
          Close
        </button>
      </div>
      <form className="space-y-4" onSubmit={submit} aria-describedby={error ? 'client-form-error' : undefined}>
        <ClientFormFields
          form={form}
          onChange={(next) => {
            setForm(next)
            setFieldErrors({})
          }}
          taxIdDisabled={mode === 'edit'}
          errors={fieldErrors}
        />
        <DocumentEditor
          clientId={clientIdForDocs}
          documents={form.documents}
          fileInputResetKey={fileInputResetKey}
          errors={documentErrors}
          onChange={setDocuments}
          onRemoveRow={handleRemoveRow}
          onError={setError}
        />
        <FormError id="client-form-error" message={error} />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={requestClose}>
            Cancel
          </button>
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save client'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
