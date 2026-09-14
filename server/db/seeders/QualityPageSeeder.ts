import {defineSeeder} from '@holo-js/db'
import type {QualityPageContent} from '@/lib/cms/contracts'
import source from '../seed-data/site-content.json'
import WebsiteSetting from '@/server/models/WebsiteSetting'

export function getQualityPageSeedContent():QualityPageContent {
  const setting = source.website_settings.find(row => row.setting_key === 'quality')!
  return structuredClone(setting.value) as QualityPageContent
}

export default defineSeeder({name: 'quality_page', async run() {
  const setting = source.website_settings.find(row => row.setting_key === 'quality')!
  await WebsiteSetting.firstOrCreate({setting_key: setting.setting_key}, {value: setting.value})
}})
