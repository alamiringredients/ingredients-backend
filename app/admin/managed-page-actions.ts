'use server'

import {adminActionError} from '@/server/admin/form-actions'
import {validate} from '@holo-js/forms'
import {revalidatePath} from 'next/cache'
import {saveCmsPayload} from '@/app/admin/cms-schema'
import {isManagedPageKey,managedPageDefinitions} from '@/lib/cms/managed-pages'
import {persistManagedPageContent} from '@/server/services/cms/managed-page-content'
import type {ManagedPageContent} from '@/lib/cms/contracts'
import {requireAdminPermission} from '@/server/admin/authorization'
import {safeUrl} from '@/lib/catalog/validation'
import {cmsCardIds} from '@/lib/cms/card-ids'

export async function saveManagedPageAction(formData:FormData){
  try{
    const data=await validate(formData,saveCmsPayload)
    if(!isManagedPageKey(data.key))return {ok:false,message:'The page key is not valid.'}
    await requireAdminPermission(managedPageDefinitions[data.key].resource,'edit')
    const value=JSON.parse(data.payload) as ManagedPageContent
    if(!value.seo||!Array.isArray(value.sections)||value.sections.some(section=>!Array.isArray(section.texts)||!Array.isArray(section.assets)||!Array.isArray(section.links)))return {ok:false,message:'The page content is not valid.'}
    value.seo.socialImage=safeUrl(value.seo.socialImage)
    for(const section of value.sections){
      for(const asset of section.assets)asset.value=safeUrl(asset.value)
      for(const link of section.links)link.value=safeUrl(link.value)
      if(section.cards){
        if(!Array.isArray(section.cards)||section.cards.length>cmsCardIds.length)return {ok:false,message:`A card list can contain up to ${cmsCardIds.length} cards.`}
        const ids=new Set<string>()
        section.cards=section.cards.map((card,index)=>{
          const id=cmsCardIds.some(route=>route===card.id)&&!ids.has(card.id)?card.id:cmsCardIds.find(route=>!ids.has(route))
          if(!id)throw new Error(`Card ${index+1} does not have a fixed destination.`)
          ids.add(id)
          return {...card,id}
        })
      }
    }
    await persistManagedPageContent(data.key,value)
    revalidatePath(`/admin/${data.key}`)
    return {ok:true,message:`${managedPageDefinitions[data.key].label} saved.`}
  }catch(error){return adminActionError(error)}
}
