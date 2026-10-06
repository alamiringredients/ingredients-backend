import 'server-only'
import {basename} from 'node:path'
import {Media, MediaItem} from '@holo-js/media'

// Uploaded files already have an authoritative byte count in Holo's media table.
// Resolve only the requested public URLs; never fetch arbitrary external URLs.
export async function getPdfFileSizes(urls: string[]): Promise<Record<string, number>> {
  const requested = new Set(urls.filter(Boolean))
  const sizes: Record<string, number> = {}
  if (!requested.size) return sizes
  const names=[...new Set([...requested].flatMap(url=>{
    try{return [basename(decodeURIComponent(new URL(url,'http://local').pathname))]}
    catch{return []}
  }))]
  const records = names.length ? await Media.where('mime_type', 'application/pdf').whereIn('file_name',names)
    .select('id','disk','path','size','file_name','generated_conversions','conversions_disk').get() : []
  for (const entity of records) {
    // Holo's loaded-relation type is narrower than MediaItem's constructor type.
    const media = new MediaItem(entity as unknown as ConstructorParameters<typeof MediaItem>[0])
    const url = media.getUrl()
    if (url && requested.has(url) && Number.isSafeInteger(media.size) && media.size >= 0) sizes[url] = media.size
  }
  return sizes
}
