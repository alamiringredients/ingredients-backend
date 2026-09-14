import cache from '@holo-js/cache'
import {DB} from '@holo-js/db'
import {contentCacheKeys, layoutCacheKeys, homepageCacheKeys} from '@/server/support/cache-keys'

export class HomeSectionObserver {
  async created(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([contentCacheKeys.homeSections, ...layoutCacheKeys, ...homepageCacheKeys].map(key => cache.forget(key))) })
  }

  async updated(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([contentCacheKeys.homeSections, ...layoutCacheKeys, ...homepageCacheKeys].map(key => cache.forget(key))) })
  }

  async deleted(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([contentCacheKeys.homeSections, ...layoutCacheKeys, ...homepageCacheKeys].map(key => cache.forget(key))) })
  }
}
