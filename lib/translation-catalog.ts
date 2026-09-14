import cache from '@holo-js/cache'

import {createHash} from 'node:crypto'
import {cmsLocales} from './cms/contracts'
import {contentTranslation} from './content-translation-values'
import {contentCacheKeys} from '@/server/support/cache-keys'
import interfaceTranslationSources from '@/server/db/seed-data/interface-translation-sources.json'
import ContentTranslation from '@/server/models/ContentTranslation'
import '@/server/models/ContentTranslationValue'

export type TranslationEntry = {
  key: string
  page: string
  source: string
  translations: {en: string; ar: string; fr: string}
  previousTranslations?: {en:string;ar:string;fr:string}
  baseline?: {en:string;ar:string;fr:string}
}

export function canonicalizeTranslationDefinitions(entries:TranslationEntry[]):TranslationEntry[]{
  const bySource=new Map<string,TranslationEntry>()
  for(const entry of entries){
    const existing=bySource.get(entry.source)
    if(!existing){bySource.set(entry.source,structuredClone(entry));continue}
    for(const locale of cmsLocales) if(existing.translations[locale]===entry.source&&entry.translations[locale]!==entry.source) existing.translations[locale]=entry.translations[locale]
  }
  return [...bySource.values()]
}

export function resolveTranslationDefinitions(expected:TranslationEntry[],stored:TranslationEntry[]):TranslationEntry[]{
  const byKey=new Map(stored.map(entry=>[entry.key,entry])),bySource=new Map(stored.map(entry=>[entry.source,entry]))
  return expected.map(entry=>{
    const saved=byKey.get(entry.key)??bySource.get(entry.source)
    if(!saved)throw new Error(`Translation ${entry.key} is missing from the database. Run the content_translations seeder.`)
    return {...entry,baseline:entry.translations,translations:saved.translations}
  })
}

export function getTranslationDefinitions(): TranslationEntry[] {
  return interfaceTranslationSources.flatMap(({page,sources}) =>
    sources.map(text => ({
      key: `${page.replaceAll('/', '.')}.${createHash('sha1').update(text).digest('hex').slice(0, 12)}`,
      page,
      source: text,
      translations: {
        en: text,
        ar: contentTranslation('ar', text),
        fr: contentTranslation('fr', text),
      },
    }))) as TranslationEntry[]
}

export async function getTranslationCatalog():Promise<TranslationEntry[]> {
  const rows=await cache.rememberForever(contentCacheKeys.contentTranslations, () => ContentTranslation.with('values').orderBy('page').orderBy('translation_key').getJson() as unknown as Promise<Record<string,unknown>[]>)
  const seedDefinitions=new Map(getTranslationDefinitions().map(entry=>[entry.key,entry]))
  return rows.map(row=>{
    const key=String(row.translation_key)
    const seed=seedDefinitions.get(key)
    const values=row.values as Record<string,unknown>[]
    return {key,page:String(row.page),source:String(row.source),...(seed?{baseline:seed.translations}:{}),translations:Object.fromEntries(values.map(value=>[String(value.locale),String(value.value)])) as TranslationEntry['translations']}
  })
}
