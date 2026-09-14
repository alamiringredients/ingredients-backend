import {defineSeeder} from '@holo-js/db'
import type {DownloadsPageContent} from '@/lib/downloads/contracts'
import snapshot from '../seed-data/managed-content-snapshot.json'
import source from '../seed-data/site-content.json'
import WebsiteSetting from '@/server/models/WebsiteSetting'

export function getDownloadsPageSeedContent():DownloadsPageContent {
  return structuredClone(snapshot.downloads) as DownloadsPageContent
}

export default defineSeeder({name: 'downloads_page', async run() {
  const setting = source.website_settings.find(row => row.setting_key === 'downloads')!
  await WebsiteSetting.firstOrCreate({setting_key: setting.setting_key}, {value: setting.value})
}})
