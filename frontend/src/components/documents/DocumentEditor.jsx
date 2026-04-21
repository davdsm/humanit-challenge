import { emptyDocumentRow } from '../../lib/clientForm'
import { MAX_UPLOAD_BYTES } from '../../constants/upload'
import { formatBytes } from '../../lib/formatBytes'
import { DocumentRow } from './DocumentRow'

export function DocumentEditor({ clientId, documents, fileInputResetKey = 0, errors = [], onChange, onRemoveRow, onError }) {
  function patchDoc(index, patch) {
    onChange(documents.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  function addDoc() {
    onChange([...documents, emptyDocumentRow()])
  }

  function removeDoc(index) {
    const row = documents[index]
    if (onRemoveRow) {
      onRemoveRow(index, row)
      return
    }
    const next = documents.filter((_, i) => i !== index)
    onChange(next.length ? next : [emptyDocumentRow()])
  }

  const canRemoveRow = documents.length > 1

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Supporting files</p>
        <button type="button" className="btn-ghost text-xs" onClick={addDoc}>
          Add file
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Allowed: PDF, PNG, JPG, WebP, plain text, Word (.docx). Max {formatBytes(MAX_UPLOAD_BYTES)} per file.
      </p>
      <div className="space-y-3">
        {documents.map((doc, index) => (
          <DocumentRow
            key={doc.id ?? `draft-${index}`}
            clientId={clientId}
            index={index}
            doc={doc}
            fileInputResetKey={fileInputResetKey}
            errors={errors[index] || {}}
            onPatch={patchDoc}
            onRemove={removeDoc}
            onError={onError}
            canRemove={canRemoveRow || Boolean(doc.id)}
          />
        ))}
      </div>
    </div>
  )
}
