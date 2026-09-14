import cache from '@holo-js/cache'
import {DB} from '@holo-js/db'
import {searchCacheKeys, downloadsCacheKeys, catalogCacheKeys, contentCacheKeys, layoutCacheKeys} from '@/server/support/cache-keys'

export class ProductTranslationObserver {
  async created(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, contentCacheKeys.products, ...downloadsCacheKeys, ...catalogCacheKeys, ...layoutCacheKeys].map(key => cache.forget(key))) })
  }

  async updated(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, contentCacheKeys.products, ...downloadsCacheKeys, ...catalogCacheKeys, ...layoutCacheKeys].map(key => cache.forget(key))) })
  }

  async deleted(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, contentCacheKeys.products, ...downloadsCacheKeys, ...catalogCacheKeys, ...layoutCacheKeys].map(key => cache.forget(key))) })
  }
}
