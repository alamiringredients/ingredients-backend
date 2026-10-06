'use server'
import {storeMediaPaths, resolveMediaReferences} from '@/server/support/media-references'
import {removeDecorativeFields} from '@/lib/cms/decorative-fields'
import {removeInternalNavigationLinks} from '@/lib/cms/navigation-links'
import cache from '@holo-js/cache'
import {sustainabilityCacheKeys} from '@/server/support/cache-keys'

import { requireAdminPermission } from '@/server/admin/authorization'
import { adminActionError,redirectCreatedRecord } from '@/server/admin/form-actions'
import { sectionVisibility } from '@/lib/cms/section-visibility'
import { decode,newsLocales } from '@/lib/news/contracts'
import { newsSlug } from '@/lib/news/validation'
import type { CmsLocale } from '@/lib/cms/contracts'
import type { SustainabilityContent,SustainabilityPageContent } from '@/lib/sustainability/contracts'
import { validateSustainabilityContent,validateSustainabilityVersion } from '@/lib/sustainability/validation'
import SustainabilityArticle from '@/server/models/SustainabilityArticle'
import SustainabilityArticleTranslation from '@/server/models/SustainabilityArticleTranslation'
import SustainabilityPublication from '@/server/models/SustainabilityPublication'
import SustainabilityRevision from '@/server/models/SustainabilityRevision'
import SustainabilityGoal from '@/server/models/SustainabilityGoal'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import { DB } from '@holo-js/db'
import {getSustainabilityRecords} from '@/server/services/sustainability/records'
const parse=(raw:string)=>{if(typeof raw!=='string'||raw.length>1500000)throw new Error('Content exceeds the document limit.');return JSON.parse(raw)}
export async function saveSustainability(id:number,revision:number,slugInput:string,raw:string,operation:'save'|'publish'|'unpublish'='save',locale:CmsLocale='en'){
 const originalId=id
 try{
  if(!Number.isSafeInteger(id)||id<0||!Number.isSafeInteger(revision)||revision<0||!newsLocales.includes(locale)||!['save','publish','unpublish'].includes(operation))throw new Error('Invalid article request.')
  await requireAdminPermission('sustainability',id?'edit':'create')
  const parsed=parse(raw)
  const slug=newsSlug(slugInput),content=validateSustainabilityContent(parsed)
  if(content.goalIds.length&&(await SustainabilityGoal.whereIn('id',content.goalIds).getJson()).length!==content.goalIds.length)return {ok:false,message:'Choose existing sustainability goals.',errors:{'content.goalIds':['One or more selected goals no longer exist.']}}
  if(operation==='publish')validateSustainabilityVersion(content.locales[locale],true)
  const result = await DB.writeTransaction(async () => {
   const current=id?await SustainabilityArticle.find(id):null
   if(id&&!current)throw new Error('Article not found.')
   if(current&&Number(current.revision)!==revision)throw new Error('This article changed in another session. Reload before saving.')
   if(current&&current.slug!==slug)throw new Error('Existing article URLs are permanent.')
   const existing=current?(await getSustainabilityRecords(id))[0]:undefined
   const nextRevision=revision+1
   const values={slug,revision:nextRevision,article_date:new Date(`${content.date}T00:00:00.000Z`),updated_date:new Date(`${content.updatedDate}T00:00:00.000Z`),featured:content.featured,sort_order:content.sortOrder,primary_goal_id:content.primaryGoal||null}
   const article=current??await SustainabilityArticle.create(values)
   if(current)await article.update(values)
   const storedContent=await storeMediaPaths(content)
   for(const language of newsLocales)await SustainabilityArticleTranslation.upsert({article_id:Number(article.id),locale:language},{content:storedContent.locales[language]})
   await article.goals().sync(content.goalIds)
   const published={...existing?.published}
  if(operation==='publish'){
    const {locales:versions,...metadata}=storedContent
    await SustainabilityPublication.upsert({article_id:Number(article.id),locale},{revision:nextRevision,article_date:new Date(`${content.date}T00:00:00.000Z`),featured:content.featured,sort_order:content.sortOrder,metadata,content:versions[locale],published_at:new Date()})
    published[locale]=content.locales[locale]
   }else if(operation==='unpublish'){
    await SustainabilityPublication.where('article_id',article.id).where('locale',locale).delete()
    delete published[locale]
   }
   if(existing){
    await SustainabilityRevision.create({article_id:Number(article.id),revision:existing.revision,content:await storeMediaPaths(existing.content)})
    const retained=await SustainabilityRevision.where('article_id',article.id).orderBy('id','desc').limit(10).get()
    if(retained.length===10)await SustainabilityRevision.where('article_id',article.id).where('id','<',retained.at(-1)!.id).delete()
   }
   return {id:Number(article.id),revision:nextRevision,content,published}
  })
  await Promise.all(sustainabilityCacheKeys.map(key=>cache.forget(key)))
  await redirectCreatedRecord(originalId,result.id,'/admin/sustainability','sustainability');return {ok:true as const,message:operation==='save'?'Draft saved.':`${locale.toUpperCase()} ${operation==='publish'?'published':'unpublished'}.`,...result}
 }catch(e){return adminActionError(e)}
}
export async function deleteSustainability(id:number){try{
 await requireAdminPermission('sustainability','delete');if(!Number.isSafeInteger(id)||id<1)throw new Error('Invalid article.')
 await DB.transaction(async()=>{const article=await SustainabilityArticle.findOrFail(id);await SustainabilityRevision.where('article_id',id).delete();await article.delete()})
 await Promise.all(sustainabilityCacheKeys.map(key=>cache.forget(key)))
 return {ok:true,message:'Article deleted.'}
}catch(e){return adminActionError(e)}}
export async function sustainabilityRevisions(id:number){await requireAdminPermission('sustainability','view');return resolveMediaReferences((await SustainabilityRevision.where('article_id',id).orderBy('id','desc').limit(10).getJson()).map(r=>({id:Number(r.id),date:new Date(r.created_at as string|Date).toISOString(),content:decode<SustainabilityContent>(r.content)})))}
export async function saveSustainabilityPage(raw:string){try{
 await requireAdminPermission('sustainability_page','edit')
 const value=parse(raw) as SustainabilityPageContent,row=await WebsiteSetting.where('setting_key','sustainability').firstOrFail(),saved=decode<SustainabilityPageContent>(row.value)
 if(!Array.isArray(value.sections)||value.sections.length!==saved.sections.length)throw new Error('Invalid page sections.')
 const sections=saved.sections.map(original=>{const edited=value.sections.find(s=>s.key===original.key);if(!edited)throw new Error('A section is missing.');return {...original,enabled:Boolean(edited.enabled),texts:original.texts.map(f=>({...f,values:edited.texts.find(e=>e.id===f.id)?.values??f.values})),richTexts:original.richTexts?.map(f=>({...f,values:edited.richTexts?.find(e=>e.id===f.id)?.values??f.values})),assets:original.assets.map(f=>({...f,value:edited.assets.find(e=>e.id===f.id)?.value??f.value})),links:original.links.map(f=>({...f,value:edited.links.find(e=>e.id===f.id)?.value??f.value}))}})
 await DB.transaction(async () => {
  await (await WebsiteSetting.findOrFail(Number(row.id))).update(await storeMediaPaths({value:{...saved,sections:removeDecorativeFields(removeInternalNavigationLinks(sections)),sectionVisibility:sectionVisibility(value.sectionVisibility,['related'] as const),relatedTitle:value.relatedTitle,relatedKicker:value.relatedKicker,seo:value.seo}}))
 });return {ok:true,message:'Sustainability page saved.'}
}catch(e){return adminActionError(e)}}
