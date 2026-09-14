import {defineSeeder} from '@holo-js/db'
import {managedPageKeys} from '@/lib/cms/managed-pages'
import source from '../seed-data/site-content.json'
import WebsiteSetting from '@/server/models/WebsiteSetting'

export default defineSeeder({name: 'managed_pages', async run() {
  for (const setting of source.website_settings) {
    if (managedPageKeys.some(key => key === setting.setting_key)) await WebsiteSetting.firstOrCreate({setting_key: setting.setting_key}, {value: setting.value})
  }
}})
