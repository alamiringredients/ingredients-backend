import cache from '@holo-js/cache'
import {DB} from '@holo-js/db'
import {pageCacheKeys, contentCacheKeys} from '@/server/support/cache-keys'

export class ContentTranslationObserver {
  async created(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([contentCacheKeys.contentTranslations, contentCacheKeys.catalogTranslations, ...pageCacheKeys].map(key => cache.forget(key))) })
  }

  async updated(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([contentCacheKeys.contentTranslations, contentCacheKeys.catalogTranslations, ...pageCacheKeys].map(key => cache.forget(key))) })
  }

  async deleted(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([contentCacheKeys.contentTranslations, contentCacheKeys.catalogTranslations, ...pageCacheKeys].map(key => cache.forget(key))) })
  }
}
