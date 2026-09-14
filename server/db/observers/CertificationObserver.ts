import cache from '@holo-js/cache'
import {DB} from '@holo-js/db'
import {searchCacheKeys, downloadsCacheKeys, qualityCacheKeys, catalogCacheKeys, certificationCacheKeys, contentCacheKeys, homepageCacheKeys} from '@/server/support/cache-keys'

export class CertificationObserver {
  async created(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, contentCacheKeys.certifications, ...certificationCacheKeys, ...downloadsCacheKeys, ...qualityCacheKeys, ...catalogCacheKeys, ...homepageCacheKeys].map(key => cache.forget(key))) })
  }

  async updated(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, contentCacheKeys.certifications, ...certificationCacheKeys, ...downloadsCacheKeys, ...qualityCacheKeys, ...catalogCacheKeys, ...homepageCacheKeys].map(key => cache.forget(key))) })
  }

  async deleted(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, contentCacheKeys.certifications, ...certificationCacheKeys, ...downloadsCacheKeys, ...qualityCacheKeys, ...catalogCacheKeys, ...homepageCacheKeys].map(key => cache.forget(key))) })
  }
}
