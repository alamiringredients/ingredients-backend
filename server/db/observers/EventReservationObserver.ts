import cache from '@holo-js/cache'
import {DB} from '@holo-js/db'
import {eventsCacheKeys, contentCacheKeys, homepageCacheKeys} from '@/server/support/cache-keys'

export class EventReservationObserver {
  async created(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([contentCacheKeys.events, contentCacheKeys.eventSlots, ...eventsCacheKeys, ...homepageCacheKeys].map(key => cache.forget(key))) })
  }

  async updated(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([contentCacheKeys.events, contentCacheKeys.eventSlots, ...eventsCacheKeys, ...homepageCacheKeys].map(key => cache.forget(key))) })
  }

  async deleted(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all([contentCacheKeys.events, contentCacheKeys.eventSlots, ...eventsCacheKeys, ...homepageCacheKeys].map(key => cache.forget(key))) })
  }
}
