import cache from '@holo-js/cache'
import {DB} from '@holo-js/db'
import {contentCacheKeyForSetting, contentCacheKeys, pageCacheKeys} from '@/server/support/cache-keys'
import {managedPageKeys} from '@/lib/cms/managed-pages'

const keys = [...new Set([
  contentCacheKeys.homeSeo,
  contentCacheKeys.websiteSettings,
  contentCacheKeys.downloadsPage,
  contentCacheKeys.qualityPage,
  contentCacheKeys.catalogSettings,
  'cms:about-page:v1',
  'cms:careers-page:v1',
  ...['about', 'careers', 'home_seo', 'website', 'downloads', 'quality', 'catalog', 'news', 'sustainability'].map(contentCacheKeyForSetting),
  ...managedPageKeys.map(contentCacheKeyForSetting),
  ...pageCacheKeys,
])]

export class WebsiteSettingObserver {
  async created(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all(keys.map(key => cache.forget(key))) })
  }

  async updated(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all(keys.map(key => cache.forget(key))) })
  }

  async deleted(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all(keys.map(key => cache.forget(key))) })
  }
}
