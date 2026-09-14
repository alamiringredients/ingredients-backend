import cache from '@holo-js/cache'
import {DB} from '@holo-js/db'
import {searchCacheKeys, newsCacheKeys} from '@/server/support/cache-keys'

export class NewsTaxonomyObserver {
  async created(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, ...newsCacheKeys].map(key => cache.forget(key))) })
  }

  async updated(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, ...newsCacheKeys].map(key => cache.forget(key))) })
  }

  async deleted(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, ...newsCacheKeys].map(key => cache.forget(key))) })
  }
}
