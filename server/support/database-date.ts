/** MySQL DATE values are calendar dates, even when the driver returns a local Date. */
export function databaseDate(value: unknown): string {
  if (value == null) return ''
  if (!(value instanceof Date)) return String(value).slice(0, 10)
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}
