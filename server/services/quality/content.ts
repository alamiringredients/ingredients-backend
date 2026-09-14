import cache from '@holo-js/cache'
import 'server-only'

import WebsiteSetting from '@/server/models/WebsiteSetting'
import {contentCacheKeys} from '@/server/support/cache-keys'
import type {QualityPageContent} from '@/lib/cms/contracts'
import {decodeStoredJson} from '@/lib/cms/stored-json'

function decode(value: unknown): QualityPageContent | null {
  const decoded = decodeStoredJson<unknown>(value)
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return null
  const content = decoded as Partial<QualityPageContent>
  return content.hero && content.body && content.seo && content.sectionVisibility ? content as QualityPageContent : null
}

export const getQualityPageContent = async (): Promise<QualityPageContent> => {
  const record = await cache.rememberForever(contentCacheKeys.qualityPage, async () => (await WebsiteSetting.where('setting_key', 'quality').firstJson()) ?? null)
  const content = decode(record?.value)
  if (!content) throw new Error('Quality page content is missing. Run the quality_page database seeder.')
  return content
}
