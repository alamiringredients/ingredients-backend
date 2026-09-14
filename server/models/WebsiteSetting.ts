import {defineModel} from '@holo-js/db'
import {defineMediaModel} from '@holo-js/media'
import {cmsMediaDefinition} from '@/server/support/cms-media'
import {WebsiteSettingObserver} from '@/server/db/observers/WebsiteSettingObserver'

const WebsiteSetting = defineModel('website_settings', {
  observers: [WebsiteSettingObserver],
  fillable: ['setting_key', 'value'],
})

export default defineMediaModel(WebsiteSetting, cmsMediaDefinition())
