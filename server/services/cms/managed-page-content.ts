import cache from '@holo-js/cache'
import 'server-only'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import {contentCacheKeyForSetting} from '@/server/support/cache-keys'
import type {ManagedPageContent} from '@/lib/cms/contracts'
import type {ManagedPageKey} from '@/lib/cms/managed-pages'
import {decodeStoredJson} from '@/lib/cms/stored-json'

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
  await row.update({value})
}
