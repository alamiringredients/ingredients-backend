import type {Catalog} from '@/lib/catalog/contracts'
import snapshot from './managed-content-snapshot.json'

/** Editorial baseline captured after converting the dashboard fields to rich text. */
export function getCatalogSeedContent():Catalog {
  return structuredClone(snapshot.catalog) as Catalog
}
