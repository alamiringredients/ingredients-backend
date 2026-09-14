import 'server-only'

import type {CmsLocale, LocalizedValue, ManagedPageContent, QualityPageContent, WebsiteSettings} from '@/lib/cms/contracts'
import cache from '@holo-js/cache'
import {requireContent} from '@/lib/cms/stored-json'
import {getSearchInterfaceDefinitions} from '@/server/db/seed-data/search-interface-definitions'
import {productPath, type CatalogSettings, type CategoryContent, type ProductContent} from '@/lib/catalog/contracts'
import {downloadableCertifications,effectiveStatus, type Certification, type CertificationType} from '@/lib/certifications/contracts'
import {textContent} from '@/lib/editor/document'
import {searchableText,searchResults,type SearchResult} from '@/lib/search/match'
import {resolveTranslationDefinitions, type TranslationEntry} from '@/lib/translation-catalog'
import {contentCacheKeyForPage} from '@/server/support/cache-keys'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import ContentTranslation from '@/server/models/ContentTranslation'
import '@/server/models/ContentTranslationValue'
import NewsPublication from '@/server/models/NewsPublication'
import CareerJob from '@/server/models/CareerJob'
import '@/server/models/NewsArticle'
import {getCertificationTranslationDefinitions} from '@/server/db/seed-data/certification-translation-definitions'
import {buildCertificationInterfaceLabels} from '@/server/services/certifications/interface'
import {getCatalogSeedTranslationDefinitions} from '@/server/db/seed-data/catalog-translation-definitions'
import {applyCatalogTranslations} from '@/lib/catalog/translations'
import {databaseDate} from '@/server/support/database-date'
import ProductCategory from '@/server/models/ProductCategory'
import Product from '@/server/models/Product'
import ProductApplication from '@/server/models/ProductApplication'
import ConcentrationRange from '@/server/models/ConcentrationRange'
import CertificationModel from '@/server/models/Certification'
import CertificationTypeModel from '@/server/models/CertificationType'
import '@/server/models/ProductCategoryTranslation'
import '@/server/models/ProductTranslation'
import '@/server/models/ProductApplicationTranslation'
import '@/server/models/ConcentrationRangeTranslation'
import '@/server/models/CertificationTranslation'
import '@/server/models/CertificationTypeTranslation'
import type {DownloadsPageContent} from '@/lib/downloads/contracts'
import type {NewsPageContent, NewsVersion} from '@/lib/news/contracts'
import type {CareersContent, JobRecord} from '@/lib/careers/contracts'
import {field, schema, validate, isValidationException} from '@holo-js/forms'

type Row = Record<string, unknown>
type JobCard = Omit<JobRecord, 'content'> & {content: Record<CmsLocale, Pick<JobRecord['content'][CmsLocale], 'title' | 'summary' | 'department' | 'location' | 'contract' | 'experience'>>}
type SearchSettings = {
  downloads: Pick<DownloadsPageContent, 'sectionVisibility' | 'heroDescription' | 'productEyebrow' | 'companyEyebrow' | 'profileLabel'>
  website: Pick<WebsiteSettings, 'companyProfile'>
  quality: Pick<QualityPageContent, 'seo' | 'body'>
  news: Record<CmsLocale, Pick<NewsPageContent[CmsLocale], 'kicker'>>
  careers: Pick<CareersContent, 'jobsKicker'>
}

async function getSearchData(locale: CmsLocale) {
  const searchDefinitions = getSearchInterfaceDefinitions()
  const certificationDefinitions = getCertificationTranslationDefinitions()
  const catalogDefinitions = getCatalogSeedTranslationDefinitions()
  const definitions = [...searchDefinitions, ...certificationDefinitions, ...catalogDefinitions]
  return cache.rememberForever(contentCacheKeyForPage('search', locale), async () => {
    const [settings, publications, jobs, translationEntities, categoryRows, productRows, applicationRows, concentrationRows, certificationRows, certificationTypeRows] = await Promise.all([
      WebsiteSetting.whereIn('setting_key', ['search', 'downloads', 'website', 'quality', 'news', 'careers', 'catalog']).getJson(),
      NewsPublication.with('article').where('locale', locale).orderBy('article_date').orderBy('article_id').getJson() as unknown as Promise<Row[]>,
      CareerJob.where('status', 'open').orderBy('id').getJson(),
      ContentTranslation.with({values: query => query.where('locale', locale)})
        .where(query => query.whereIn('translation_key', definitions.map(entry => entry.key)).orWhere(group => group.whereIn('source', definitions.map(entry => entry.source))))
        .getJson() as unknown as Promise<Row[]>,
      ProductCategory.with({translations: query => query.where('locale', locale)}).where('published', true).whereHas('products', query => query.where('published', true)).orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      Product.with({translations: query => query.where('locale', locale), applications: query => query.where('is_active', true), concentrations: query => query.where('is_active', true)}).where('published', true).whereHas('category', query => query.where('published', true)).orderBy('category_id').orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      ProductApplication.with({translations: query => query.where('locale', locale)}).where('is_active', true).orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      ConcentrationRange.with({translations: query => query.where('locale', locale)}).where('is_active', true).orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      CertificationModel.with({translations: query => query.where('locale', locale)}).where('published', true).orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      CertificationTypeModel.with({translations: query => query.where('locale', locale)}).orderBy('id').getJson() as unknown as Promise<Row[]>,
    ])
    const setting = <T>(key: string) => requireContent<T>(settings.find(row => row.setting_key === key)?.value, key)
    const pages: SearchSettings = {
      downloads: setting('downloads'),
      website: setting('website'),
      quality: setting('quality'),
      news: setting('news'),
      careers: setting('careers'),
    }
    const translations: TranslationEntry[] = translationEntities.map(row => ({
      key: String(row.translation_key), page: String(row.page), source: String(row.source),
      translations: {[locale]: String(((row.values as Row[])[0]?.value) ?? '')} as TranslationEntry['translations'],
    }))
    const categories = categoryRows.map(row => {
      const translated = (row.translations as Row[])[0]
      const content = requireContent<CategoryContent>(translated.content, 'Category')
      return {id: Number(row.id), slug: String(row.slug), published: true, sort_order: Number(row.sort_order), content: {...content, name: {[locale]: String(translated.name)}, description: {[locale]: String(translated.description)}, seo: {title: {[locale]: String(translated.seo_title)}, description: {[locale]: String(translated.seo_description)}, socialTitle: null, socialDescription: null, socialImage: null}, page: content.page ?? {blocks: []}} as unknown as CategoryContent}
    })
    const categoryRank = new Map(categories.map((row, index) => [row.id, index]))
    const products = productRows.map(row => {
      const translated = (row.translations as Row[])[0]
      const content = requireContent<ProductContent>(translated.content, 'Product')
      return {id: Number(row.id), category_id: Number(row.category_id), slug: String(row.slug), published: true, sort_order: Number(row.sort_order), content: {...content, name: {[locale]: String(translated.name)}, description: {[locale]: String(translated.description)}, seo: {title: {[locale]: String(translated.seo_title)}, description: {[locale]: String(translated.seo_description)}, socialTitle: null, socialDescription: null, socialImage: null}, applications: (row.applications as Row[]).map(item => String(item.slug)), concentrations: (row.concentrations as Row[]).map(item => String(item.slug)), page: content.page ?? {blocks: []}} as unknown as ProductContent}
    }).sort((left, right) => Number(categoryRank.get(left.category_id)) - Number(categoryRank.get(right.category_id)))
    const option = (row: Row) => ({id: String(row.slug), label: {[locale]: String(((row.translations as Row[])[0]?.name) ?? '')} as LocalizedValue})
    const catalogSetting = settings.find(row => row.setting_key === 'catalog')
    const catalogSettings = requireContent<CatalogSettings>(catalogSetting?.value, 'Catalog settings')
    const catalog = applyCatalogTranslations({categories, products, settings: {...catalogSettings, applications: applicationRows.map(option), concentrations: concentrationRows.map(option), blocks: catalogSettings.blocks ?? []}}, resolveTranslationDefinitions(catalogDefinitions, translations), locale)
    const certifications: Certification[] = certificationRows.map(row => ({id: Number(row.id), type_id: Number(row.type_id), holder: row.holder as Certification['holder'], status: row.status as Certification['status'], published: true, sort_order: Number(row.sort_order), content: {scope: Object.fromEntries((row.translations as Row[]).map(item => [String(item.locale), String(item.scope)])) as Certification['content']['scope'], target_date: databaseDate(row.target_date), issue_date: databaseDate(row.issue_date), expiry_date: databaseDate(row.expiry_date), certificate_number: String(row.certificate_number), document: String(row.document)}}))
    const typeIds = new Set(certifications.map(record => record.type_id))
    const types: CertificationType[] = certificationTypeRows.filter(row => typeIds.has(Number(row.id))).map(row => ({id: Number(row.id), slug: String(row.slug), content: {kind: row.kind, logo: row.logo, badge: row.badge, name: Object.fromEntries((row.translations as Row[]).map(item => [String(item.locale), String(item.name)])), description: Object.fromEntries((row.translations as Row[]).map(item => [String(item.locale), String(item.description)]))}} as CertificationType))
    const certificationValues = Object.fromEntries(resolveTranslationDefinitions(certificationDefinitions, translations).map(entry => [entry.key.replace('certification.interface.', ''), entry.translations[locale]]))
    return {
      content: setting<ManagedPageContent>('search'),
      searchLabels: Object.fromEntries(resolveTranslationDefinitions(searchDefinitions, translations).map(entry => [entry.key.replace('search.interface.', ''), entry.translations[locale]])),
      catalog,
      certifications: {certifications, types},
      labels: buildCertificationInterfaceLabels(certificationValues),
      pages,
      jobs: jobs.map(row => ({id: Number(row.id), slug: String(row.slug), code: String(row.code), status: 'open', content: requireContent(row.content, 'Job')} as JobCard)),
      news: publications.map(row => ({slug: String((row.article as Row).slug), published: {[locale]: requireContent<NewsVersion>(row.content, 'Published news')}})),
    }
  })
}

async function buildSearchIndex(locale:CmsLocale, data = getSearchData(locale)) {
  const {catalog,certifications,labels,pages,news,jobs}=await data
  const {downloads,website:settings,quality,news:newsPage,careers}=pages
  const records:SearchResult[]=[]
  const add=(href:string,title:string,description:string,section:string,content:unknown)=>{
    if(title.trim())records.push({href,title,description,section,text:searchableText(content,locale)})
  }
  for(const category of catalog.categories){
    add(locale==='en'?`/products/${category.slug}`:`/${locale}/products/${category.slug}`,category.content.name[locale],category.content.description[locale],catalog.settings.labels.products[locale],category.content)
  }
  for(const product of catalog.products){
    const category=catalog.categories.find(item=>item.id===product.category_id)!
    const path=productPath(product,category)
    add(locale==='en'?path:`/${locale}${path}`,product.content.name[locale],product.content.description[locale],category.content.name[locale],product.content)
    if(downloads.sectionVisibility.products&&product.content.tds[locale])add(product.content.tds[locale],product.content.name[locale],product.content.description[locale],downloads.productEyebrow[locale],product.content)
  }
  add(locale==='en'?'/quality':`/${locale}/quality`,quality.seo.title[locale],quality.seo.description[locale],quality.seo.title[locale],quality.body[locale])
  for(const record of certifications.certifications){
    const type=certifications.types.find(item=>item.id===record.type_id)!
    add(locale==='en'?'/quality':`/${locale}/quality`,type.content.name[locale],record.content.scope[locale],labels.statuses[effectiveStatus(record)],{description:type.content.description,scope:record.content.scope,number:record.content.certificate_number})
  }
  if(downloads.sectionVisibility.company)for(const record of downloadableCertifications(certifications)){
    add(record.content.document,record.type.content.name[locale],record.content.scope[locale],downloads.companyEyebrow[locale],record.type.content.description)
  }
  if(downloads.sectionVisibility.company&&settings.companyProfile[locale])add(settings.companyProfile[locale],downloads.profileLabel[locale],downloads.heroDescription[locale],downloads.companyEyebrow[locale],downloads.profileLabel)
  for(const article of news){
    const published=article.published[locale]
    if(published)add(locale==='en'?`/news/${article.slug}`:`/${locale}/news/${article.slug}`,textContent(published.title),published.summary,newsPage[locale].kicker,published)
  }
  for(const job of jobs.filter(item=>item.status==='open')){
    const content=job.content[locale]
    add(locale==='en'?`/careers/${job.slug}`:`/${locale}/careers/${job.slug}`,content.title,content.summary,careers.jobsKicker[locale],content)
  }
  return records
}

async function getSearchPayload(query: string, locale: CmsLocale) {
  if (!query.trim()) {
    const definitions = getSearchInterfaceDefinitions()
    const stored = await cache.rememberForever(contentCacheKeyForPage('search-page', locale), async () => {
      const [setting, translationEntities] = await Promise.all([
        WebsiteSetting.where('setting_key', 'search').firstJson(),
        ContentTranslation.with({values: relation => relation.where('locale', locale)})
          .where(builder => builder.whereIn('translation_key', definitions.map(entry => entry.key)).orWhere(group => group.whereIn('source', definitions.map(entry => entry.source))))
          .getJson() as unknown as Promise<Row[]>,
      ])
      if (!setting) throw new Error('Search page content is missing. Run the managed pages seeder.')
      return {setting: setting.value, translationEntities}
    })
    const translations: TranslationEntry[] = stored.translationEntities.map(row => ({
      key: String(row.translation_key), page: String(row.page), source: String(row.source),
      translations: {[locale]: String(((row.values as Row[])[0]?.value) ?? '')} as TranslationEntry['translations'],
    }))
    return {
      content: requireContent<ManagedPageContent>(stored.setting, 'Search page'),
      labels: Object.fromEntries(resolveTranslationDefinitions(definitions, translations).map(entry => [entry.key.replace('search.interface.', ''), entry.translations[locale]])),
      results: [] as SearchResult[],
    }
  }
  const data = getSearchData(locale)
  const {content, searchLabels} = await data
  return {content, labels: searchLabels, results: searchResults(await buildSearchIndex(locale, data), query)}
}

export async function payload(request: Request) {
  try {
    const search = new URL(request.url).searchParams
    const {locale} = await validate({locale: search.get('locale')?.trim()}, schema({locale: field.string().required().in(['en','ar','fr'])}))
    const data = await getSearchPayload((search.get('query') ?? '').slice(0, 200), locale)
    return Response.json({data}, {headers: {'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'}})
  } catch (error) {
    if (isValidationException(error)) return Response.json({message: error.message}, {status: error.status})
    console.error('Public search request failed', error)
    return Response.json({message: 'Unable to load content.'}, {status: 500})
  }
}
