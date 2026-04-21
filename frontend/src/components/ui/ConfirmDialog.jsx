import { useEffect, useRef } from 'react'

export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null)

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
    function handleCancel(e) {
      e.preventDefault()
      if (!busy) onCancel?.()
    }
    el.addEventListener('cancel', handleCancel)
    return () => el.removeEventListener('cancel', handleCancel)
  }, [busy, onCancel])

  return (
    <dialog ref={dialogRef} className="morph-dialog glass-panel w-full max-w-md p-0">
      <div className="p-5">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn-primary bg-rose-600 text-white hover:bg-rose-500' : 'btn-primary'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
