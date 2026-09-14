import 'server-only'

import cache from '@holo-js/cache'
import type {CmsLocale} from '@/lib/cms/contracts'
import type {AboutContent, CareersContent, JobRecord} from '@/lib/careers/contracts'
import {careersSectionKeys} from '@/lib/careers/contracts'
import type {NewsRecord, NewsVersion} from '@/lib/news/contracts'
import {requireContent} from '@/lib/cms/stored-json'
import {sectionVisibility} from '@/lib/cms/section-visibility'
import {getCareersInterfaceDefinitions} from '@/server/db/seed-data/careers-interface'
import {resolveTranslationDefinitions, type TranslationEntry} from '@/lib/translation-catalog'
import {contentCacheKeyForPage} from '@/server/support/cache-keys'
import CareerJob from '@/server/models/CareerJob'
import NewsPublication from '@/server/models/NewsPublication'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import ContentTranslation from '@/server/models/ContentTranslation'
import '@/server/models/NewsArticle'
import '@/server/models/ContentTranslationValue'
import {field, schema, validate, isValidationException} from '@holo-js/forms'

type Row = Record<string, unknown>
type NewsCardVersion = Pick<NewsVersion, 'title' | 'summary' | 'cardTitle' | 'cardSummary' | 'hero' | 'heroAlt'>
type NewsCardRecord = Pick<NewsRecord, 'id' | 'slug'> & {content: Omit<NewsRecord['content'], 'cmsLocales'>; published: Partial<Record<CmsLocale, NewsCardVersion>>}
type JobCard = Omit<JobRecord, 'content'> & {content: Record<CmsLocale, Pick<JobRecord['content'][CmsLocale], 'title' | 'summary' | 'department' | 'location' | 'contract' | 'experience'>>}

async function getCareersPayload(locale: CmsLocale, slug?: string) {
  const definitions = getCareersInterfaceDefinitions()
  const stored = await cache.rememberForever(contentCacheKeyForPage('careers', locale), async () => {
    const [setting, jobs, publications, translationEntities] = await Promise.all([
      WebsiteSetting.where('setting_key', 'careers').firstJson(),
      CareerJob.where('status', 'open').orderBy('id').getJson(),
      NewsPublication.with('article').where('locale', locale).orderBy('article_date').orderBy('article_id').getJson() as unknown as Promise<Row[]>,
      ContentTranslation.with({values: query => query.where('locale', locale)})
        .where(query => query.whereIn('translation_key', definitions.map(entry => entry.key)).orWhere(group => group.whereIn('source', definitions.map(entry => entry.source))))
        .getJson() as unknown as Promise<Row[]>,
    ])
    if (!setting) throw new Error('Careers page content is missing. Run the careers seeder.')
    return {setting: setting.value, jobs, publications, translationEntities}
  })
  const page = requireContent<AboutContent & CareersContent>(stored.setting, 'Careers page')
  const content = {...page, body: {...page.body}, sectionVisibility: sectionVisibility(page.sectionVisibility, careersSectionKeys)}
  const jobs: JobCard[] = stored.jobs.map(row => {
    const storedContent = requireContent<JobRecord['content']>(row.content, 'Job')
    return {
      id: Number(row.id), slug: String(row.slug), code: String(row.code), status: 'open',
      content: Object.fromEntries(Object.entries(storedContent).map(([language, job]) => [language, {
        title: job.title,
        summary: job.summary,
        department: job.department,
        location: job.location,
        contract: job.contract,
        experience: job.experience,
      }])) as JobCard['content'],
    }
  })
  const selected = slug ? stored.jobs.find(row => row.slug === slug) : undefined
  const job: JobRecord | null = selected ? {id: Number(selected.id), slug: String(selected.slug), code: String(selected.code), status: 'open', content: requireContent(selected.content, 'Job')} : null
  const news: NewsCardRecord[] = content.sectionVisibility.news ? stored.publications.filter(row => content.newsIds.includes(Number(row.article_id))).map(row => {
    const published = requireContent<NewsVersion>(row.content, 'Published news')
    return {
      id: Number(row.article_id), slug: String((row.article as Row).slug), content: requireContent(row.metadata, 'News metadata'),
      published: {[locale]: {
        title: published.title,
        summary: published.summary,
        cardTitle: published.cardTitle,
        cardSummary: published.cardSummary,
        hero: published.hero,
        heroAlt: published.heroAlt,
      }},
    }
  }) : []
  const translations: TranslationEntry[] = stored.translationEntities.map(row => ({
    key: String(row.translation_key), page: String(row.page), source: String(row.source),
    translations: {[locale]: String(((row.values as Row[])[0]?.value) ?? '')} as TranslationEntry['translations'],
  }))
  return {content, jobs, job, news, labels: Object.fromEntries(resolveTranslationDefinitions(definitions, translations).map(entry => [entry.key.replace('careers.interface.', ''), entry.translations[locale]]))}
}

export async function payload(request: Request) {
  try {
    const search = new URL(request.url).searchParams
    const {locale} = await validate({locale: search.get('locale')?.trim()}, schema({locale: field.string().required().in(['en','ar','fr'])}))
    const data = await getCareersPayload(locale, search.get('slug') ?? undefined)
    return Response.json({data}, {headers: {'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'}})
  } catch (error) {
    if (isValidationException(error)) return Response.json({message: error.message}, {status: error.status})
    console.error('Public careers request failed', error)
    return Response.json({message: 'Unable to load content.'}, {status: 500})
  }
}
