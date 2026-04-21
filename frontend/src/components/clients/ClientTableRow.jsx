export function ClientTableRow({ client, rowIndex = 0, selected, onSelectToggle, onEdit, onDelete }) {
  const displayName = `${client.firstName} ${client.lastName}`.trim()
  const delay = `${Math.min(700, 360 + rowIndex * 70)}ms`

  return (
    <tr
      className="reveal-up border-t border-slate-200 transition-colors duration-150 hover:bg-slate-50"
      style={{ '--reveal-delay': delay }}
    >
      <td className="px-4 py-3">
        <input
          type="checkbox"
          className="h-4 w-4 accent-slate-900"
          checked={selected}
          onChange={() => onSelectToggle(client.id)}
          aria-label={`Select ${displayName}`}
        />
      </td>
      <td className="px-4 py-3 font-medium text-slate-900">{displayName}</td>
      <td className="px-4 py-3 text-slate-600">{client.email}</td>
      <td className="px-4 py-3 text-slate-600">{client.taxIdentifier}</td>
      <td className="px-4 py-3 text-slate-600">{client.documents?.length || 0}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="icon-btn h-9 w-9"
            onClick={() => onEdit(client)}
            aria-label={`Edit ${displayName}`}
            title="Edit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 20h9" strokeLinecap="round" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--danger h-9 w-9"
            onClick={() => onDelete(client)}
            aria-label={`Delete ${displayName} from directory`}
            title="Delete"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}
