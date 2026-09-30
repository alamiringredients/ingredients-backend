import {nameManagedSections} from '@/lib/cms/section-names'
import {removeProductsCertificationFields} from '@/lib/cms/products-content'
import {removeDecorativeFields} from '@/lib/cms/decorative-fields'
import cache from '@holo-js/cache'
import 'server-only'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import {contentCacheKeyForSetting} from '@/server/support/cache-keys'
import type {ManagedPageContent} from '@/lib/cms/contracts'
import type {ManagedPageKey} from '@/lib/cms/managed-pages'
import {decodeStoredJson} from '@/lib/cms/stored-json'
import {removeCompanyInformation} from '@/lib/cms/company-information'
import {removeInternalNavigationLinks} from '@/lib/cms/navigation-links'

export async function getManagedPageContent(key:ManagedPageKey):Promise<ManagedPageContent>{
  return cache.rememberForever(contentCacheKeyForSetting(key),async()=>{
    const row=await WebsiteSetting.where('setting_key',key).firstJson()
    if(!row)throw new Error(`Managed content for ${key} is missing. Run the managed_pages seeder.`)
    return decodeStoredJson<ManagedPageContent>(row.value)
  })
}

export async function persistManagedPageContent(key:ManagedPageKey,value:ManagedPageContent){
  const row=await WebsiteSetting.where('setting_key',key).first()
  if(!row)throw new Error(`Managed content for ${key} is missing. Run the managed_pages seeder.`)
  value=nameManagedSections(key,value)
  if(key==='products')value=removeProductsCertificationFields(value)
  await row.update({value:removeDecorativeFields(removeCompanyInformation(removeInternalNavigationLinks(value)))})
}
