export function sectionVisibility<const K extends string>(value: unknown, keys: readonly K[]): Record<K, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The page section visibility is not valid.')
  }

  const input = value as Record<string, unknown>
  return Object.fromEntries(keys.map(key => {
    const enabled = input[key]
    if (typeof enabled !== 'boolean') throw new Error('The page section visibility is not valid.')
    return [key, enabled]
  })) as Record<K, boolean>
}
