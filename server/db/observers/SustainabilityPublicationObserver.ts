import cache from '@holo-js/cache'
import {DB} from '@holo-js/db'
import {sustainabilityCacheKeys} from '@/server/support/cache-keys'

export class SustainabilityPublicationObserver {
  async created(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all(sustainabilityCacheKeys.map(key => cache.forget(key))) })
  }

  async updated(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all(sustainabilityCacheKeys.map(key => cache.forget(key))) })
  }

  async deleted(): Promise<void> {
    DB.afterCommit(async () => { await Promise.all(sustainabilityCacheKeys.map(key => cache.forget(key))) })
  }
}
