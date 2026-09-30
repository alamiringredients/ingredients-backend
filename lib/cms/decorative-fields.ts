const symbols = new Set(['->', '<-', '→', '←', '↗', '↘', '↑', '↓', '×', '✕', '✖', '.', '/', '|', '•', '·', '…', '+', '−', '—', '–', '*'])

export function isDecorativeField(source: string): boolean {
  return symbols.has(source.replaceAll('&gt;', '>').replaceAll('&lt;', '<').trim())
}

export function removeDecorativeFields<T>(content: T): T {
  if (Array.isArray(content)) return content.map(removeDecorativeFields) as T
  if (!content || typeof content !== 'object') return content
  return Object.fromEntries(Object.entries(content).map(([key, value]) => [
    key,
    key === 'texts' && Array.isArray(value) ? value.filter(field => !isDecorativeField(field.source)) : removeDecorativeFields(value),
  ])) as T
}
