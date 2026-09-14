import cache from '@holo-js/cache'
import {DB} from '@holo-js/db'
import {searchCacheKeys, newsCacheKeys, careersCacheKeys} from '@/server/support/cache-keys'

export class NewsPublicationObserver {
  async created(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, ...newsCacheKeys, ...careersCacheKeys].map(key => cache.forget(key))) })
  }

  async updated(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, ...newsCacheKeys, ...careersCacheKeys].map(key => cache.forget(key))) })
  }

  async deleted(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, ...newsCacheKeys, ...careersCacheKeys].map(key => cache.forget(key))) })
  }
}
