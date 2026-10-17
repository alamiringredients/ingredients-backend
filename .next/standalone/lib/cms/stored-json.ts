export function decodeStoredJson<T>(value: unknown): T {
  return (typeof value === 'string' ? JSON.parse(value) : value) as T
}

export function requireContent<T>(value: unknown, owner: string): T {
  const content = decodeStoredJson<unknown>(value)
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    throw new Error(`${owner} content is missing or invalid. Run its owning content seeder.`)
  }
  return content as T
}
