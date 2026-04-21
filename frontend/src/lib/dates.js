/** @param {string | Date | undefined} value */
export function toDateInputValue(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

/** @param {string} dateStr from `<input type="date" />` */
export function dateInputToIsoUtc(dateStr) {
  if (!dateStr) return ''
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString()
}
