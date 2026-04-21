import { documentDownloadUrl } from '../../lib/api'
import { MAX_UPLOAD_BYTES } from '../../constants/upload'
import { buildMaxFileSizeMessage } from '../../lib/errorMessages'
import { formatBytes } from '../../lib/formatBytes'
import { FormField } from '../ui/FormField'

const ACCEPT =
  '.pdf,.png,.jpg,.jpeg,.webp,.txt,.docx,application/pdf,image/png,image/jpeg,image/webp,text/plain'

export function DocumentRow({ clientId, index, doc, fileInputResetKey = 0, errors = {}, onPatch, onRemove, onError, canRemove }) {
  const base = `doc-${index}`

  return (
    <div className="glass-panel p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          {doc.id && clientId ? (
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600">Stored file</p>
              <p className="text-sm text-slate-800">
                <a
                  className="font-medium text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
                  href={documentDownloadUrl(clientId, doc.id)}
                  download={doc.originalName || 'document'}
                >
                  {doc.originalName || 'Download'}
                </a>
                <span className="text-slate-500"> · {formatBytes(doc.sizeBytes)}</span>
              </p>
            </div>
          ) : (
            <FormField id={`${base}-file`} label="Choose file" error={errors.file}>
              <input
                key={`${base}-file-${fileInputResetKey}`}
                id={`${base}-file`}
                type="file"
                className={`field file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-800 ${errors.file ? 'border-rose-300 bg-rose-50/70' : ''}`}
                accept={ACCEPT}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  if (file && file.size > MAX_UPLOAD_BYTES) {
                    e.target.value = ''
                    onPatch(index, { file: null, originalName: '' })
                    onError?.(buildMaxFileSizeMessage(MAX_UPLOAD_BYTES))
                    return
                  }
                  onPatch(index, {
                    file,
                    originalName: file?.name ?? '',
                  })
                }}
              />
              {doc.file ? (
                <p className="mt-1 text-xs text-slate-500">
                  Selected: {doc.originalName} ({formatBytes(doc.file.size)})
                </p>
              ) : null}
            </FormField>
          )}
        </div>
        <div className="flex items-end justify-end">
          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            aria-label={`Remove document row ${index + 1}`}
          >
            Remove
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <FormField id={`${base}-expiration`} label="Expiration date" error={errors.expirationDate}>
          <input
            id={`${base}-expiration`}
            type="date"
            className={`field ${errors.expirationDate ? 'border-rose-300 bg-rose-50/70' : ''}`}
            value={doc.expirationDate}
            onChange={(e) => onPatch(index, { expirationDate: e.target.value })}
          />
        </FormField>
        <FormField id={`${base}-description`} label="Notes (optional)">
          <input
            id={`${base}-description`}
            className="field"
            value={doc.description}
            onChange={(e) => onPatch(index, { description: e.target.value })}
            placeholder="e.g. annual license renewal"
          />
        </FormField>
      </div>
    </div>
  )
}
