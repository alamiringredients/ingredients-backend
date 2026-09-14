import cache from '@holo-js/cache'
import {DB} from '@holo-js/db'
import {searchCacheKeys, careersCacheKeys} from '@/server/support/cache-keys'

export class CareerJobObserver {
  async created(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, ...careersCacheKeys].map(key => cache.forget(key))) })
  }

  async updated(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, ...careersCacheKeys].map(key => cache.forget(key))) })
  }

  async deleted(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([...searchCacheKeys, ...careersCacheKeys].map(key => cache.forget(key))) })
  }
}
