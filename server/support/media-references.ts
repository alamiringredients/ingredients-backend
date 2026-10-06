import {Media, MediaItem} from '@holo-js/media'

// Holo's default media paths contain a stable UUID, including conversion paths.
function mediaPath(value: string) {
  if (!/^(https?:\/\/|\/)/i.test(value)) return null
  try {
    const path = new URL(value, 'http://local').pathname
    return /\/media\/([a-f0-9-]{36})\/(.+)$/i.exec(path)
  } catch {
    return null
  }
}

function assetPath(value: string) {
  if (!/^(https?:\/\/|\/)/i.test(value)) return null
  try {
    const path = decodeURIComponent(new URL(value, 'http://local').pathname)
    return path.startsWith('/assets/') ? path : null
  } catch {
    return null
  }
}

function mapContent<T>(value: T, map: (value: string) => string): T {
  if (typeof value === 'string') return map(value) as T
  if (Array.isArray(value)) return value.map(item => mapContent(item, map)) as T
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === 'source' ? item : mapContent(item, map)])) as T
  }
  return value
}

/** Select existing Holo media in one query, then use its public path/URL helpers. */
async function mediaValues<T>(content: T, output: 'path' | 'url'): Promise<T> {
  const uuids = new Set<string>()
  const assets = new Set<string>()
  mapContent(content, value => {
    const match = output === 'url' && !value.startsWith('/') ? null : mediaPath(value)
    if (match) uuids.add(match[1])
    const asset = output === 'url' && !value.startsWith('/') ? null : assetPath(value)
    if (asset) assets.add(asset.slice(1))
    return value
  })
  if (!uuids.size && !assets.size) return content
  let query = Media.query()
  if (uuids.size) query = query.whereIn('uuid', [...uuids])
  if (assets.size) query = uuids.size ? query.orWhere(group => group.whereIn('path', [...assets])) : query.whereIn('path', [...assets])
  const rows = await query.get()
  const values = new Map<string, string>()
  const originals = new Map<string, string>()
  const assetUrls = new Map<string, string>()
  for (const row of rows) {
    const item = new MediaItem(row as unknown as ConstructorParameters<typeof MediaItem>[0])
    const original = output === 'path' ? item.getPath() : item.getUrl()
    if (original) originals.set(String(item.record.uuid), original)
    for (const conversion of [undefined, ...item.getAvailableConversions()]) {
      const path = item.getPath(conversion)
      const key = path && (mediaPath(path)?.[0] ?? assetPath(path))
      const value = output === 'path' ? path : item.getUrl(conversion)
      if (key && value) {
        values.set(key, value)
        const url = item.getUrl(conversion)
        if (url && assetPath(path!)) assetUrls.set(key, new URL(url, 'http://local').href)
      }
    }
  }
  return mapContent(content, value => {
    const match = mediaPath(value)
    const key = match?.[0] ?? assetPath(value)
    if (key && output === 'path' && /^https?:\/\//i.test(value) && assetPath(value) && new URL(value).href !== assetUrls.get(key)) return value
    const fallback = match?.[2].startsWith('conversions/') ? originals.get(match[1]) : undefined
    return key ? values.get(key) ?? fallback ?? value : value
  })
}

export const storeMediaPaths = <T>(value: T) => mediaValues(value, 'path')
export const resolveMediaReferences = <T>(value: T) => mediaValues(value, 'url')
