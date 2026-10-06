import {resolveMediaReferences} from '@/server/support/media-references'
import 'server-only'

import cache from '@holo-js/cache'
import type {CmsLocale} from '@/lib/cms/contracts'
import type {SustainabilityPageContent, SustainabilityGoal, SustainabilityVersion} from '@/lib/sustainability/contracts'
import type {SustainabilityRecord} from '@/lib/sustainability/contracts'
import {requireContent} from '@/lib/cms/stored-json'
import {sectionVisibility} from '@/lib/cms/section-visibility'
import {getSustainabilityInterfaceDefinitions} from '@/server/db/seed-data/sustainability-interface-definitions'
import {resolveTranslationDefinitions, type TranslationEntry} from '@/lib/translation-catalog'
import {contentCacheKeyForPage} from '@/server/support/cache-keys'
import SustainabilityPublication from '@/server/models/SustainabilityPublication'
import SustainabilityGoalModel from '@/server/models/SustainabilityGoal'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import ContentTranslation from '@/server/models/ContentTranslation'
import '@/server/models/SustainabilityArticle'
import '@/server/models/SustainabilityGoalTranslation'
import '@/server/models/ContentTranslationValue'
import {field, schema, validate, isValidationException} from '@holo-js/forms'

type Row = Record<string, unknown>
type SustainabilityCardVersion = Pick<SustainabilityVersion, 'title' | 'cardTitle' | 'summary' | 'cardSummary' | 'badge' | 'gallery'>
type SustainabilityCard = Pick<SustainabilityRecord, 'id' | 'slug'> & {content: Omit<SustainabilityRecord['content'], 'cmsLocales'>; published: Partial<Record<CmsLocale, SustainabilityCardVersion>>}
type PublicSustainabilityArticle = Omit<SustainabilityCard, 'published'> & {published: SustainabilityRecord['published']; availableLocales: CmsLocale[]; draft?: SustainabilityVersion}

async function getSustainabilityPayload(locale: CmsLocale, slug?: string) {
  const definitions = getSustainabilityInterfaceDefinitions()
  const stored = await cache.rememberForever(contentCacheKeyForPage('sustainability', locale), async () => {
    const [publications, goals, setting, translationEntities] = await Promise.all([
      SustainabilityPublication.with('article.publications').where('locale', locale).orderBy('featured', 'desc').orderBy('sort_order').orderBy('article_id').getJson() as unknown as Promise<Row[]>,
      SustainabilityGoalModel.with({translations: query => query.where('locale', locale)}).orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      WebsiteSetting.where('setting_key', 'sustainability').firstJson(),
      ContentTranslation.with({values: query => query.where('locale', locale)})
        .where(query => query.whereIn('translation_key', definitions.map(entry => entry.key)).orWhere(group => group.whereIn('source', definitions.map(entry => entry.source))))
        .getJson() as unknown as Promise<Row[]>,
    ])
    if (!setting) throw new Error('Sustainability page content is missing. Run the sustainability seeder.')
    return {publications, goals, setting: setting.value, translationEntities}
  })
  const articles: SustainabilityCard[] = stored.publications.map(row => {
    const published = requireContent<SustainabilityVersion>(row.content, 'Published sustainability')
    return {
      id: Number(row.article_id), slug: String((row.article as Row).slug), content: requireContent(row.metadata, 'Sustainability metadata'),
      published: {[locale]: {
        title: published.title,
        cardTitle: published.cardTitle,
        summary: published.summary,
        cardSummary: published.cardSummary,
        badge: published.badge,
        gallery: published.gallery,
      }},
    }
  })
  const selected = slug ? stored.publications.find(row => (row.article as Row).slug === slug) : undefined
  const record: PublicSustainabilityArticle | null = selected ? {
    id: Number(selected.article_id), slug: String((selected.article as Row).slug), content: requireContent(selected.metadata, 'Sustainability metadata'),
    published: {[locale]: requireContent<SustainabilityVersion>(selected.content, 'Published sustainability')},
    availableLocales: (['en', 'ar', 'fr'] as const).filter(language => ((selected.article as Row).publications as Row[]).some(publication => publication.locale === language)),
  } : null
  const content = requireContent<SustainabilityPageContent>(stored.setting, 'Sustainability page')
  const goals: SustainabilityGoal[] = stored.goals.map(row => {
    const translation = (row.translations as Row[])[0]
    return {id: Number(row.id), color: String(row.color), image: String(row.image), name: (translation ? {[locale]: String(translation.name)} : {}) as SustainabilityGoal['name'], alt: (translation ? {[locale]: String(translation.alt)} : {}) as SustainabilityGoal['alt']}
  })
  const translations: TranslationEntry[] = stored.translationEntities.map(row => ({
    key: String(row.translation_key), page: String(row.page), source: String(row.source),
    translations: {[locale]: String(((row.values as Row[])[0]?.value) ?? '')} as TranslationEntry['translations'],
  }))
  return {
    articles, record,
    page: {...content, goals, sectionVisibility: sectionVisibility(content.sectionVisibility, ['related'] as const)},
    labels: Object.fromEntries(resolveTranslationDefinitions(definitions, translations).map(entry => [entry.key.replace('sustainability.interface.', ''), entry.translations[locale]])),
  }
}

export async function payload(request: Request) {
  try {
    const search = new URL(request.url).searchParams
    const {locale} = await validate({locale: search.get('locale')?.trim()}, schema({locale: field.string().required().in(['en','ar','fr'])}))
    const data = await getSustainabilityPayload(locale, search.get('slug') ?? undefined)
    return Response.json({data: await resolveMediaReferences(data)}, {headers: {'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'}})
  } catch (error) {
    if (isValidationException(error)) return Response.json({message: error.message}, {status: error.status})
    console.error('Public sustainability request failed', error)
    return Response.json({message: 'Unable to load content.'}, {status: 500})
  }
}
