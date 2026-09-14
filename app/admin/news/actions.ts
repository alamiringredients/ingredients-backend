'use server'
import cache from '@holo-js/cache'
import {newsCacheKeys, careersCacheKeys, searchCacheKeys} from '@/server/support/cache-keys'

import { requireAdminPermission } from '@/server/admin/authorization'
import {adminActionError,redirectCreatedRecord} from '@/server/admin/form-actions'
import { decode,newsLocales,type NewsContent, } from '@/lib/news/contracts'
import { newsSlug,validateNewsContent,validateNewsPage,validateTaxonomy,validateVersion } from '@/lib/news/validation'
import type { CmsLocale } from '@/lib/cms/contracts'
import NewsArticle from '@/server/models/NewsArticle'
import NewsArticleTranslation from '@/server/models/NewsArticleTranslation'
import NewsPublication from '@/server/models/NewsPublication'
import NewsRevision from '@/server/models/NewsRevision'
import NewsTaxonomy from '@/server/models/NewsTaxonomy'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import { DB } from '@holo-js/db'
import {getNewsRecords} from '@/server/services/news/records'
function payload(value:string){if(typeof value!=='string'||value.length>1000000)throw new Error('Content exceeds the document limit.');return JSON.parse(value)}
export async function saveNews(id:number,revision:number,slugInput:string,raw:string,operation:'save'|'publish'|'unpublish'='save',locale:CmsLocale='en') {
  try {
    if(!Number.isSafeInteger(id)||id<0||!Number.isSafeInteger(revision)||revision<0||!['save','publish','unpublish'].includes(operation)||!newsLocales.includes(locale))throw new Error('Invalid article request.')
    await requireAdminPermission('news',id?'edit':'create')
    const parsed=payload(raw)
    const slug=newsSlug(slugInput),content=validateNewsContent(parsed)
    const taxonomies=await NewsTaxonomy.getJson()
    if(content.categoryId&&!taxonomies.some(t=>Number(t.id)===content.categoryId&&t.kind==='category'))return {ok:false,message:'Please correct the highlighted fields.',errors:{'content.categoryId':['Choose an existing category.']}}
    if(content.tagIds.some(id=>!taxonomies.some(t=>Number(t.id)===id&&t.kind==='tag')))return {ok:false,message:'Please correct the highlighted fields.',errors:{'content.tagIds':['Choose existing tags.']}}
    if(operation==='publish'){validateVersion(content.locales[locale],true);if(!content.categoryId)return {ok:false,message:'Please correct the highlighted fields.',errors:{'content.categoryId':['Choose a category before publishing.']}}}
    for(const related of [content.previousSlug,content.nextSlug,...content.relatedSlugs]) if(related&&(related===slug||!await NewsArticle.where('slug',related).firstJson()))throw new Error('Navigation must point to another existing article.')
    const result = await DB.writeTransaction(async () => {
      const current = id
        ? await NewsArticle.find(id)
        : null
      if (id && !current) throw new Error('Article not found.')
      if (current && Number(current.revision) !== revision) throw new Error('This article changed in another session. Reload before saving.')
      if (current && current.slug !== slug) throw new Error('Existing article URLs are permanent.')

      const existing = current
        ? (await getNewsRecords(id))[0]
        : undefined
      const links = await NewsArticle.select('id', 'slug').get()
      const idBySlug = new Map(links.map(article => [article.slug, Number(article.id)]))
      const linkedId = (value: string) => value ? idBySlug.get(value) ?? null : null
      const nextRevision = revision + 1
      const values = {
        slug,
        revision: nextRevision,
        category_id: content.categoryId || null,
        article_date: new Date(`${content.date}T00:00:00.000Z`),
        featured: content.featured,
        previous_article_id: linkedId(content.previousSlug),
        next_article_id: linkedId(content.nextSlug),
      }
      const article = current ?? await NewsArticle.create(values)
      if (current) await article.update(values)

      for (const language of newsLocales) {
        await NewsArticleTranslation.upsert(
          {article_id: Number(article.id), locale: language},
          {content: content.locales[language]},
        )
      }

      await article.tags().sync(content.tagIds)
      for (const [sortOrder, tagId] of content.tagIds.entries()) {
        await article.tags().updateExistingPivot(tagId, {sort_order: sortOrder})
      }
      const relatedIds = content.relatedSlugs.map(linkedId).filter((relatedId): relatedId is number => relatedId !== null)
      await article.related().sync(relatedIds)
      for (const [sortOrder, relatedId] of relatedIds.entries()) {
        await article.related().updateExistingPivot(relatedId, {sort_order: sortOrder})
      }

      const published = {...existing?.published}
      if (operation === 'publish') {
        const {locales: versions, ...metadata} = content
        await NewsPublication.upsert(
          {article_id: Number(article.id), locale},
          {
            revision: nextRevision,
            article_date: new Date(`${content.date}T00:00:00.000Z`),
            category_id: content.categoryId,
            featured: content.featured,
            metadata,
            content: versions[locale],
            published_at: new Date(),
          },
        )
        published[locale] = versions[locale]
      } else if (operation === 'unpublish') {
        await NewsPublication.where('article_id', article.id).where('locale', locale).delete()
        delete published[locale]
      }

      if (existing) {
        await NewsRevision.create({
          article_id: Number(article.id),
          revision: existing.revision,
          content: existing.content,
        })
        const retained = await NewsRevision.where('article_id', article.id).orderBy('id', 'desc').limit(10).get()
        if (retained.length === 10) {
          await NewsRevision.where('article_id', article.id).where('id', '<', retained.at(-1)!.id).delete()
        }
      }

      return {id: Number(article.id), revision: nextRevision, content, published}
    })
    await Promise.all([...searchCacheKeys, ...newsCacheKeys, ...careersCacheKeys].map(key => cache.forget(key)))
    
    await redirectCreatedRecord(id,result.id,'/admin/news','news')
    return {ok:true as const,message:operation==='publish'?`${locale.toUpperCase()} published.`:operation==='unpublish'?`${locale.toUpperCase()} unpublished.`:'Draft saved.',...result}
  }catch(e){return adminActionError(e)}
}
export async function getNewsRevisions(id:number) {
  await requireAdminPermission('news','view')
  return (await NewsRevision.where('article_id',id).orderBy('id','desc').limit(10).getJson()).map(r=>({id:Number(r.id),date:new Date(r.created_at as string|Date).toISOString(),content:decode<NewsContent>(r.content)}))
}
export async function saveNewsTaxonomy(id:number,raw:string) {
  const originalId=id
  try {
    if(!Number.isSafeInteger(id)||id<0)throw new Error('Invalid record.')
    await requireAdminPermission('news_taxonomies',id?'edit':'create')
    const parsed=payload(raw)
    const values=validateTaxonomy(parsed)
    const duplicate=await NewsTaxonomy.where('kind',values.kind).where('slug',values.slug).firstJson()
    if(duplicate&&Number(duplicate.id)!==id)return {ok:false,message:'Please correct the highlighted fields.',errors:{slug:['This slug is already in use.']}}
    if(id)await (await NewsTaxonomy.findOrFail(id)).update(values)
    else id=Number((await NewsTaxonomy.create(values)).id)
    
    await redirectCreatedRecord(originalId,id,values.kind==='category'?'/admin/news-categories':'/admin/news-tags','news_taxonomies')
    return {ok:true as const,message:'Saved.',id}
  }catch(e){return adminActionError(e)}
}
export async function deleteNewsTaxonomy(id:number) {
  try {
    await requireAdminPermission('news_taxonomies','delete')
    if(!Number.isSafeInteger(id)||id<1)throw new Error('Invalid record.')
    const articles=await getNewsRecords()
    if(articles.some(a=>{const c=decode<NewsContent>(a.content);return c.categoryId===id||c.tagIds.includes(id)}))throw new Error('Reassign articles using this category or tag first, including drafts.')
    await (await NewsTaxonomy.findOrFail(id)).delete();return {ok:true,message:'Deleted.'}
  }catch(e){return adminActionError(e)}
}
export async function saveNewsPage(raw:string) {
  try{await requireAdminPermission('news_page','edit');const value=validateNewsPage(payload(raw));const row=await WebsiteSetting.where('setting_key','news').first();if(!row)throw new Error('News page is missing.');await row.update({value});return {ok:true,message:'News page saved.'}}catch(e){return adminActionError(e)}
}
export async function deleteNews(id:number) {
  try {
    await requireAdminPermission('news','delete')
    if(!Number.isSafeInteger(id)||id<1)throw new Error('Invalid article.')
    await DB.transaction(async()=>{
      const article=await NewsArticle.findOrFail(id)
      await NewsRevision.where('article_id',id).delete()
      await article.delete()
    })
    await Promise.all([...newsCacheKeys, ...careersCacheKeys, ...searchCacheKeys].map(key => cache.forget(key)))
    
    return {ok:true,message:'Article deleted.'}
  }catch(e){return adminActionError(e)}
}
