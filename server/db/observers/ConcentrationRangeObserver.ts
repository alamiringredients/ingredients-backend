import cache from '@holo-js/cache'
import {DB} from '@holo-js/db'
import {searchCacheKeys, catalogCacheKeys} from '@/server/support/cache-keys'

export class ConcentrationRangeObserver {
  async created(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, ...catalogCacheKeys].map(key => cache.forget(key))) })
  }

  async updated(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, ...catalogCacheKeys].map(key => cache.forget(key))) })
  }

  async deleted(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, ...catalogCacheKeys].map(key => cache.forget(key))) })
  }
}
