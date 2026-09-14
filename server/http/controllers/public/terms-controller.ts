import 'server-only'
import cache from '@holo-js/cache'
import type {ManagedPageContent} from '@/lib/cms/contracts'
import {requireContent} from '@/lib/cms/stored-json'
import {getTranslationDefinitions, resolveTranslationDefinitions, type TranslationEntry} from '@/lib/translation-catalog'
import {contentCacheKeyForPage} from '@/server/support/cache-keys'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import ContentTranslation from '@/server/models/ContentTranslation'
import '@/server/models/ContentTranslationValue'
import {field, schema, validate, isValidationException} from '@holo-js/forms'

type Row=Record<string,unknown>
export async function GET(request: Request) {
  try {
    const search = new URL(request.url).searchParams
    const {locale} = await validate({locale: search.get('locale')?.trim()}, schema({locale: field.string().required().in(['en','ar','fr'])}))
    const data = await cache.rememberForever(contentCacheKeyForPage('managed:terms',locale),async()=>{
  const definitions=getTranslationDefinitions().filter(entry=>entry.page==='terms')
  const [setting,translationRows]=await Promise.all([WebsiteSetting.where('setting_key','terms').firstJson(),definitions.length?ContentTranslation.with({values:query=>query.where('locale',locale)}).where(query=>query.whereIn('translation_key',definitions.map(entry=>entry.key)).orWhere(group=>group.whereIn('source',definitions.map(entry=>entry.source)))).getJson() as unknown as Promise<Row[]>:Promise.resolve([] as Row[])])
  if(!setting)throw new Error('Terms page content is missing. Run the managed_pages seeder.')
  const translations:TranslationEntry[]=translationRows.map(row=>({key:String(row.translation_key),page:String(row.page),source:String(row.source),translations:{[locale]:String((row.values as Row[])[0]?.value??'')} as TranslationEntry['translations']}))
      return {content:requireContent<ManagedPageContent>(setting.value,'Terms page'),translations:resolveTranslationDefinitions(definitions,translations)}
    })
    return Response.json({data}, {headers: {'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'}})
  } catch (error) {
    if (isValidationException(error)) return Response.json({message: error.message}, {status: error.status})
    console.error('Public terms request failed', error)
    return Response.json({message: 'Unable to load content.'}, {status: 500})
  }
}
