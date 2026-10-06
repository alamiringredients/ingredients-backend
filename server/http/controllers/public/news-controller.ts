import {resolveMediaReferences} from '@/server/support/media-references'
import 'server-only'

import cache from '@holo-js/cache'
import type {CmsLocale} from '@/lib/cms/contracts'
import type {NewsPageContent, NewsTaxonomy, NewsVersion} from '@/lib/news/contracts'
import {requireContent} from '@/lib/cms/stored-json'
import {sectionVisibility} from '@/lib/cms/section-visibility'
import {newsPageSectionKeys} from '@/lib/news/contracts'
import {getNewsInterfaceDefinitions} from '@/server/db/seed-data/news-interface-definitions'
import {resolveTranslationDefinitions, type TranslationEntry} from '@/lib/translation-catalog'
import {contentCacheKeyForPage} from '@/server/support/cache-keys'
import type {NewsRecord, NewsVersion as FullNewsVersion} from '@/lib/news/contracts'
import NewsPublication from '@/server/models/NewsPublication'
import NewsTaxonomyModel from '@/server/models/NewsTaxonomy'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import ContentTranslation from '@/server/models/ContentTranslation'
import '@/server/models/NewsArticle'
import '@/server/models/ContentTranslationValue'
import {field, schema, validate, isValidationException} from '@holo-js/forms'

type Row = Record<string, unknown>
type NewsCardVersion = Pick<NewsVersion, 'title' | 'summary' | 'cardTitle' | 'cardSummary' | 'hero' | 'heroAlt'>
type NewsCardRecord = Pick<NewsRecord, 'id' | 'slug'> & {content: Omit<NewsRecord['content'], 'cmsLocales'>; published: Partial<Record<CmsLocale, NewsCardVersion>>}
type PublicNewsRecord = Omit<NewsCardRecord, 'published'> & {published: NewsRecord['published']; availableLocales: CmsLocale[]; draft?: FullNewsVersion}

async function getNewsPayload(locale: CmsLocale, slug?: string) {
  const stored = await cache.rememberForever(contentCacheKeyForPage('news', locale), async () => {
    const definitions = getNewsInterfaceDefinitions()
    const [publications, taxonomies, setting, translationEntities] = await Promise.all([
      NewsPublication.with('article.publications').where('locale', locale).orderBy('article_date').orderBy('article_id').getJson() as unknown as Promise<Row[]>,
      NewsTaxonomyModel.orderBy('sort_order').orderBy('id').getJson(),
      WebsiteSetting.where('setting_key', 'news').firstJson(),
      ContentTranslation.with({values: query => query.where('locale', locale)})
        .where(query => query.whereIn('translation_key', definitions.map(entry => entry.key)).orWhere(group => group.whereIn('source', definitions.map(entry => entry.source))))
        .getJson() as unknown as Promise<Row[]>,
    ])
    if (!setting) throw new Error('News page content is missing. Run the news seeder.')
    const translations = translationEntities.map(row => ({
      key: String(row.translation_key), page: String(row.page), source: String(row.source),
      translations: {[locale]: String((row.values as Row[])[0]?.value ?? '')} as TranslationEntry['translations'],
    }))
    return {publications, taxonomies, setting: setting.value, translations}
  })
  const cards: NewsCardRecord[] = stored.publications.map(row => {
    const published = requireContent<NewsVersion>(row.content, 'Published news')
    return {
      id: Number(row.article_id),
      slug: String((row.article as Row).slug),
      content: requireContent(row.metadata, 'News metadata'),
      published: {[locale]: {
        title: published.title,
        summary: published.summary,
        cardTitle: published.cardTitle,
        cardSummary: published.cardSummary,
        hero: published.hero,
        heroAlt: published.heroAlt,
      }},
    }
  })
  const selected = slug ? stored.publications.find(row => (row.article as Row).slug === slug) : undefined
  const source: PublicNewsRecord | null = selected ? {
    id: Number(selected.article_id),
    slug: String((selected.article as Row).slug),
    content: requireContent(selected.metadata, 'News metadata'),
    published: {[locale]: requireContent<NewsVersion>(selected.content, 'Published news')},
    availableLocales: (['en', 'ar', 'fr'] as const).filter(language => ((selected.article as Row).publications as Row[]).some(publication => publication.locale === language)),
  } : null
  const content = requireContent<NewsPageContent>(stored.setting, 'News page')
  const taxonomies: NewsTaxonomy[] = stored.taxonomies.map(row => ({
    id: Number(row.id), kind: row.kind as NewsTaxonomy['kind'], slug: String(row.slug), sort_order: Number(row.sort_order),
    content: requireContent<NewsTaxonomy['content']>(row.content, 'News taxonomy'),
  }))
  const definitions = getNewsInterfaceDefinitions()
  const labels = Object.fromEntries(resolveTranslationDefinitions(definitions, stored.translations).map(entry => [entry.key.replace('news.interface.', ''), entry.translations[locale]]))
  return {cards, source, taxonomies, page: {...content, sectionVisibility: sectionVisibility(content.sectionVisibility, newsPageSectionKeys)}, labels}
}

export async function payload(request: Request) {
  try {
    const search = new URL(request.url).searchParams
    const {locale} = await validate({locale: search.get('locale')?.trim()}, schema({locale: field.string().required().in(['en','ar','fr'])}))
    const data = await getNewsPayload(locale, search.get('slug') ?? undefined)
    return Response.json({data: await resolveMediaReferences(data)}, {headers: {'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'}})
  } catch (error) {
    if (isValidationException(error)) return Response.json({message: error.message}, {status: error.status})
    console.error('Public news request failed', error)
    return Response.json({message: 'Unable to load content.'}, {status: 500})
  }
}
