export function formatFileSize(bytes: number | undefined, locale = 'en'): string | null {
  if (bytes === undefined || !Number.isSafeInteger(bytes) || bytes < 0) return null
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = bytes === 0 ? 0 : Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = new Intl.NumberFormat(locale, {maximumFractionDigits: index === 0 ? 0 : 1}).format(bytes / 1024 ** index)
  return `${value} ${units[index]}`
}
