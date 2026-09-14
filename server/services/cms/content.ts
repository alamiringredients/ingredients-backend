import cache from '@holo-js/cache'
import 'server-only'

import {contentCacheKeys} from '@/server/support/cache-keys'
import type {HomeCmsData, HomeSectionContent, HomeSeoContent, WebsiteSettings} from '@/lib/cms/contracts'
import HomeSection from '@/server/models/HomeSection'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import {decodeStoredJson} from '@/lib/cms/stored-json'

function asObject<T>(value: unknown): T | undefined {
  if (value === null || value === undefined) return undefined
  const decoded = decodeStoredJson<unknown>(value)
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
    throw new Error('Saved CMS content must be a JSON object.')
  }
  return decoded as T
}

export const getHomeCmsData = async (): Promise<HomeCmsData> => {
  const records = await cache.rememberForever(contentCacheKeys.homeSections, () => HomeSection.orderBy('sort_order').getJson())
  if (!records.length) throw new Error('Homepage content is missing. Run the home_page seeder.')
  const sections = records.map((record) => {
    const content = asObject<HomeSectionContent>(record.content)
    if (!content) throw new Error(`Homepage section ${String(record.section_key)} is missing content. Run the home_page seeder.`)
    return {...content, key:String(record.section_key), label:String(record.label), enabled:Boolean(record.enabled)}
  })
  const seoRecord = await cache.rememberForever(contentCacheKeys.homeSeo, async () => (await WebsiteSetting.where('setting_key', 'home_seo').firstJson()) ?? null)
  const seo = asObject<HomeSeoContent>(seoRecord?.value)
  if (!seo) throw new Error('Homepage SEO content is missing. Run the home_page seeder.')
  return {sections, seo}
}

export const getWebsiteSettings = async (): Promise<WebsiteSettings> => {
  const record = await cache.rememberForever(contentCacheKeys.websiteSettings, async () => (await WebsiteSetting.where('setting_key', 'website').firstJson()) ?? null)
  const settings=asObject<WebsiteSettings>(record?.value)
  if (!settings) throw new Error('Website settings are missing. Run the website_settings seeder.')
  return settings
}

export async function persistHomeSection(section: HomeSectionContent) {
  const record=await HomeSection.where('section_key',section.key).first()
  if(!record) throw new Error('Homepage section is missing. Run the home_page seeder.')
  await record.update({label:section.label,enabled:section.enabled,content:section})
}

export async function persistHomeSeo(value: HomeSeoContent) {
  await WebsiteSetting.updateOrCreate({setting_key: 'home_seo'}, {value})
}

export async function persistWebsiteSettings(value: WebsiteSettings) {
  await WebsiteSetting.updateOrCreate({setting_key: 'website'}, {value})
}
