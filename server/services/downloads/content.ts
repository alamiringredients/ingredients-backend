import cache from '@holo-js/cache'
import 'server-only'

import WebsiteSetting from '@/server/models/WebsiteSetting'
import {contentCacheKeys} from '@/server/support/cache-keys'
import type {DownloadsPageContent} from '@/lib/downloads/contracts'
import {sectionVisibility} from '@/lib/cms/section-visibility'
import {decodeStoredJson} from '@/lib/cms/stored-json'

function decode(value: unknown): DownloadsPageContent | undefined {
  const decoded = decodeStoredJson<unknown>(value)
  return decoded && typeof decoded === 'object' && !Array.isArray(decoded) ? decoded as DownloadsPageContent : undefined
}

export const getDownloadsPageContent = async (): Promise<DownloadsPageContent> => {
  const record = await cache.rememberForever(contentCacheKeys.downloadsPage, async () => (
    await WebsiteSetting.where('setting_key', 'downloads').firstJson()
  ) ?? null)
  const content=decode(record?.value)
  if(!content) throw new Error('Downloads page content is missing. Run the downloads_page seeder.')
  return {...content,sectionVisibility:sectionVisibility(content.sectionVisibility,['hero','products','company'] as const)}
}

export async function persistDownloadsPageContent(value: DownloadsPageContent) {
  await WebsiteSetting.updateOrCreate({setting_key: 'downloads'}, {value})
}
