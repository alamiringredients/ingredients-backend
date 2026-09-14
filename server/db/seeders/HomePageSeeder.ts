import type {HomeCmsData} from '@/lib/cms/contracts'
import {DB, defineSeeder} from '@holo-js/db'
import snapshot from '../seed-data/managed-content-snapshot.json'
import source from '../seed-data/site-content.json'
import HomeSection from '@/server/models/HomeSection'
import WebsiteSetting from '@/server/models/WebsiteSetting'

export function getHomePageSeedContent():HomeCmsData {
  return structuredClone(snapshot.home) as HomeCmsData
}

export default defineSeeder({name: 'home_page', async run() {
  await HomeSection.unguarded(async () => {
    for (const section of source.home_sections) {
      if (!await HomeSection.find(section.id)) await DB.table('home_sections').insert({...section, enabled: Boolean(section.enabled), content: JSON.stringify(section.content)})
    }
  })
  const setting = source.website_settings.find(row => row.setting_key === 'home_seo')!
  await WebsiteSetting.firstOrCreate({setting_key: setting.setting_key}, {value: setting.value})
}})
