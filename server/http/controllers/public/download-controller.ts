import 'server-only'

import cache from '@holo-js/cache'
import type {CmsLocale} from '@/lib/cms/contracts'
import type {DownloadsPageContent} from '@/lib/downloads/contracts'
import type {WebsiteSettings} from '@/lib/cms/contracts'
import {downloadableCertifications, type Certification, type CertificationType} from '@/lib/certifications/contracts'
import type {CatalogSettings, CategoryContent, ProductContent} from '@/lib/catalog/contracts'
import {requireContent} from '@/lib/cms/stored-json'
import {getCertificationTranslationDefinitions} from '@/server/db/seed-data/certification-translation-definitions'
import {getCatalogSeedTranslationDefinitions} from '@/server/db/seed-data/catalog-translation-definitions'
import {buildCertificationInterfaceLabels} from '@/server/services/certifications/interface'
import {resolveTranslationDefinitions, type TranslationEntry} from '@/lib/translation-catalog'
import {applyCatalogTranslations} from '@/lib/catalog/translations'
import {databaseDate} from '@/server/support/database-date'
import {contentCacheKeyForPage} from '@/server/support/cache-keys'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import ContentTranslation from '@/server/models/ContentTranslation'
import ProductCategory from '@/server/models/ProductCategory'
import Product from '@/server/models/Product'
import CertificationModel from '@/server/models/Certification'
import CertificationTypeModel from '@/server/models/CertificationType'
import '@/server/models/ProductCategoryTranslation'
import '@/server/models/ProductTranslation'
import '@/server/models/CertificationTranslation'
import '@/server/models/CertificationTypeTranslation'
import '@/server/models/ContentTranslationValue'
import {getPdfFileSizes} from '@/server/services/downloads/file-sizes'
import {field, schema, validate, isValidationException} from '@holo-js/forms'

type Row = Record<string, unknown>

async function getDownloadsPayload(locale: CmsLocale) {
  const data = await cache.rememberForever(contentCacheKeyForPage('downloads', locale), async () => {
    const certificationDefinitions = getCertificationTranslationDefinitions()
    const catalogDefinitions = getCatalogSeedTranslationDefinitions()
    const definitions = [...certificationDefinitions, ...catalogDefinitions]
    const [settings, categoryRows, productRows, certificationRows, certificationTypeRows, translationEntities] = await Promise.all([
      WebsiteSetting.whereIn('setting_key', ['downloads', 'website', 'catalog']).getJson(),
      ProductCategory.with({translations: query => query.where('locale', locale)}).where('published', true).whereHas('products', query => query.where('published', true)).orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      Product.with({translations: query => query.where('locale', locale)}).where('published', true).whereHas('category', query => query.where('published', true)).orderBy('category_id').orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      CertificationModel.with({translations: query => query.where('locale', locale)}).where('published', true).orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      CertificationTypeModel.with({translations: query => query.where('locale', locale)}).orderBy('id').getJson() as unknown as Promise<Row[]>,
      ContentTranslation.with({values: query => query.where('locale', locale)})
        .where(query => query.whereIn('translation_key', definitions.map(entry => entry.key)).orWhere(group => group.whereIn('source', definitions.map(entry => entry.source))))
        .getJson() as unknown as Promise<Row[]>,
    ])
    const downloadSetting = settings.find(row => row.setting_key === 'downloads')
    const websiteSetting = settings.find(row => row.setting_key === 'website')
    const catalogSetting = settings.find(row => row.setting_key === 'catalog')
    if (!downloadSetting || !websiteSetting || !catalogSetting) throw new Error('Downloads page content is missing. Run the downloads_page seeder.')
    const translations: TranslationEntry[] = translationEntities.map(row => ({
      key: String(row.translation_key), page: String(row.page), source: String(row.source),
      translations: {[locale]: String((row.values as Row[])[0]?.value ?? '')} as TranslationEntry['translations'],
    }))
    const categories = categoryRows.map(row => {
      const translated = (row.translations as Row[])[0]
      return {id: Number(row.id), slug: String(row.slug), published: true, sort_order: Number(row.sort_order), content: {name: {[locale]: String(translated.name)}, page: {blocks: []}} as unknown as CategoryContent}
    })
    const categoryRank = new Map(categories.map((row, index) => [row.id, index]))
    const products = productRows.map(row => {
      const translated = (row.translations as Row[])[0]
      const content = requireContent<ProductContent>(translated.content, 'Product')
      return {id: Number(row.id), category_id: Number(row.category_id), slug: String(row.slug), published: true, sort_order: Number(row.sort_order), content: {name: {[locale]: String(translated.name)}, tds: content.tds, page: {blocks: []}} as unknown as ProductContent}
    }).sort((left, right) => Number(categoryRank.get(left.category_id)) - Number(categoryRank.get(right.category_id)))
    const catalogSettings = requireContent<CatalogSettings>(catalogSetting.value, 'Catalog settings')
    const catalog = applyCatalogTranslations({categories, products, settings: {...catalogSettings, blocks: [], applications: [], concentrations: []}}, resolveTranslationDefinitions(catalogDefinitions, translations), locale)
    const certifications: Certification[] = certificationRows.map(row => ({
      id: Number(row.id), type_id: Number(row.type_id), holder: row.holder as Certification['holder'], status: row.status as Certification['status'], published: true, sort_order: Number(row.sort_order),
      content: {scope: Object.fromEntries((row.translations as Row[]).map(item => [String(item.locale), String(item.scope)])) as Certification['content']['scope'], target_date: databaseDate(row.target_date), issue_date: databaseDate(row.issue_date), expiry_date: databaseDate(row.expiry_date), certificate_number: String(row.certificate_number), document: String(row.document)},
    }))
    const typeIds = new Set(certifications.map(record => record.type_id))
    const types: CertificationType[] = certificationTypeRows.filter(row => typeIds.has(Number(row.id))).map(row => ({id: Number(row.id), slug: String(row.slug), content: {kind: row.kind, logo: row.logo, badge: row.badge, name: Object.fromEntries((row.translations as Row[]).map(item => [String(item.locale), String(item.name)])), description: Object.fromEntries((row.translations as Row[]).map(item => [String(item.locale), String(item.description)]))}} as CertificationType))
    const values = Object.fromEntries(resolveTranslationDefinitions(certificationDefinitions, translations).map(entry => [entry.key.replace('certification.interface.', ''), entry.translations[locale]]))
    return {
      content: requireContent<DownloadsPageContent>(downloadSetting.value, 'Downloads page'),
      settings: requireContent<WebsiteSettings>(websiteSetting.value, 'Website settings'),
      catalog,
      certifications: {certifications, types},
      labels: buildCertificationInterfaceLabels(values),
    }
  })
  const fileSizes = await getPdfFileSizes([
    ...downloadableCertifications(data.certifications).map(record => record.content.document),
    ...data.catalog.products.map(product => product.content.tds[locale]),
    data.settings.companyProfile[locale],
  ])
  return {content: data.content, catalog: data.catalog, certifications: data.certifications, labels: data.labels, fileSizes}
}

export async function payload(request: Request) {
  try {
    const search = new URL(request.url).searchParams
    const {locale} = await validate({locale: search.get('locale')?.trim()}, schema({locale: field.string().required().in(['en','ar','fr'])}))
    const data = await getDownloadsPayload(locale)
    return Response.json({data}, {headers: {'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'}})
  } catch (error) {
    if (isValidationException(error)) return Response.json({message: error.message}, {status: error.status})
    console.error('Public downloads request failed', error)
    return Response.json({message: 'Unable to load content.'}, {status: 500})
  }
}
