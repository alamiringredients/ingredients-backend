import 'server-only'

import cache from '@holo-js/cache'
import type {LocalizedValue, ManagedPageContent} from '@/lib/cms/contracts'
import type {CmsLocale} from '@/lib/cms/contracts'
import {requireContent} from '@/lib/cms/stored-json'
import type {Catalog, Category, Product as CatalogProduct, CatalogSettings, CategoryContent, ProductContent} from '@/lib/catalog/contracts'
import {applyCatalogTranslations} from '@/lib/catalog/translations'
import {resolveTranslationDefinitions, type TranslationEntry} from '@/lib/translation-catalog'
import {getCatalogSeedTranslationDefinitions} from '@/server/db/seed-data/catalog-translation-definitions'
import {contentCacheKeyForPage, contentCacheKeyForSetting} from '@/server/support/cache-keys'
import ProductCategory from '@/server/models/ProductCategory'
import ProductModel from '@/server/models/Product'
import ProductApplication from '@/server/models/ProductApplication'
import ConcentrationRange from '@/server/models/ConcentrationRange'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import ContentTranslation from '@/server/models/ContentTranslation'
import '@/server/models/ProductCategoryTranslation'
import '@/server/models/ProductTranslation'
import '@/server/models/ProductApplicationTranslation'
import '@/server/models/ConcentrationRangeTranslation'
import '@/server/models/ContentTranslationValue'
import {field, schema, validate, isValidationException} from '@holo-js/forms'
import {getCertificationTranslationDefinitions} from '@/server/db/seed-data/certification-translation-definitions'
import {buildCertificationInterfaceLabels} from '@/server/services/certifications/interface'
import {databaseDate} from '@/server/support/database-date'
import type {Certification, CertificationType} from '@/lib/certifications/contracts'
import CertificationModel from '@/server/models/Certification'
import CertificationTypeModel from '@/server/models/CertificationType'
import '@/server/models/CertificationTranslation'
import '@/server/models/CertificationTypeTranslation'

type Row = Record<string, unknown>
type PublicContent = Partial<CategoryContent & ProductContent>

function translatedContent(row: Row, locale: CmsLocale) {
  const translation = (row.translations as Row[]).find(item => item.locale === locale)
  if (!translation) throw new Error(`Catalog translation for ${String(row.slug)} is missing.`)
  const content = requireContent<PublicContent>(translation.content, 'Catalog')
  return {
    ...content,
    name: {[locale]: String(translation.name)} as LocalizedValue,
    description: {[locale]: String(translation.description)} as LocalizedValue,
    seo: {
      title: {[locale]: String(translation.seo_title)} as LocalizedValue,
      description: {[locale]: String(translation.seo_description)} as LocalizedValue,
    },
  }
}

function localizedOptions(rows: Row[], locale: CmsLocale) {
  return rows.map(row => {
    const translation = (row.translations as Row[]).find(item => item.locale === locale)
    return {id: String(row.slug), label: {[locale]: String(translation?.name ?? '')} as LocalizedValue}
  })
}

async function getPublicCatalog(locale: CmsLocale, page = 'navigation'): Promise<Catalog> {
  const stored = await cache.rememberForever(contentCacheKeyForPage('catalog', locale), async () => {
    const definitions = getCatalogSeedTranslationDefinitions()
    const [categories, products, applications, concentrations, setting, translationEntities] = await Promise.all([
      ProductCategory.with({translations: query => query.where('locale', locale)}).where('published', true)
        .whereHas('products', query => query.where('published', true)).orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      ProductModel.with({
        translations: query => query.where('locale', locale),
        applications: query => query.where('is_active', true),
        concentrations: query => query.where('is_active', true),
      }).where('published', true).whereHas('category', query => query.where('published', true))
        .orderBy('category_id').orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      ProductApplication.with({translations: query => query.where('locale', locale)}).where('is_active', true).orderBy('sort_order').orderBy('id').getJson(),
      ConcentrationRange.with({translations: query => query.where('locale', locale)}).where('is_active', true).orderBy('sort_order').orderBy('id').getJson(),
      WebsiteSetting.where('setting_key', 'catalog').firstJson(),
      ContentTranslation.with({values: query => query.where('locale', locale)})
        .where(query => query.whereIn('translation_key', definitions.map(entry => entry.key)).orWhere(group => group.whereIn('source', definitions.map(entry => entry.source))))
        .orderBy('translation_key').getJson() as unknown as Promise<Row[]>,
    ])
    if (!setting) throw new Error('Catalog content is missing. Run the product_catalog seeder.')
    const translations = translationEntities.map(row => ({
      key: String(row.translation_key), page: String(row.page), source: String(row.source),
      translations: {[locale]: String((row.values as Row[])[0]?.value ?? '')} as TranslationEntry['translations'],
    }))
    return {categories, products, applications, concentrations, settings: requireContent<CatalogSettings>(setting.value, 'Catalog settings'), translations}
  })

  const isNavigation = page === 'navigation' || page === 'downloads'
  const isSearch = page === 'search'
  const [, selectedCategory, selectedProduct] = page.split('/')
  const selectedCategoryId = stored.categories.find(row => row.slug === selectedCategory)?.id
  const selectedCategoryProducts = stored.products.filter(row => Number(row.category_id) === Number(selectedCategoryId))
  const categories: Category[] = stored.categories.map(row => {
    const content = translatedContent(row, locale)
    const selected = row.slug === selectedCategory && !selectedProduct
    return {
      id: Number(row.id), slug: String(row.slug), published: true, sort_order: Number(row.sort_order),
      content: {
        name: content.name,
        ...(!isNavigation && !isSearch ? {description: content.description, seo: content.seo} : {}),
        ...(page === 'products' ? {artwork: content.artwork} : {}),
        ...(isNavigation ? {icon: content.icon} : {}),
        ...(selected ? {page: content.page} : {page: {blocks: []}}),
      } as CategoryContent,
    }
  })
  const categoryRank = new Map(categories.map((row, index) => [row.id, index]))
  const products: CatalogProduct[] = stored.products.map(row => {
    const content = translatedContent(row, locale)
    const selected = Number(row.category_id) === Number(selectedCategoryId) && (row.slug === selectedProduct || (!selectedProduct && selectedCategoryProducts.length === 1))
    return {
      id: Number(row.id), category_id: Number(row.category_id), slug: String(row.slug), published: true, sort_order: Number(row.sort_order),
      content: {
        name: content.name,
        ...(isNavigation ? {gallery: content.gallery?.slice(0, 1)} : {}),
        ...(page === 'downloads' ? {tds: content.tds} : {}),
        ...(!isNavigation && !isSearch ? {
          description: content.description,
          seo: content.seo,
          artwork: content.artwork,
          applications: (row.applications as Row[]).map(item => String(item.slug)),
          concentrations: (row.concentrations as Row[]).map(item => String(item.slug)),
        } : {}),
        ...(selected ? {page: content.page, gallery: content.gallery, tds: content.tds} : {page: {blocks: []}}),
      } as ProductContent,
    }
  }).sort((left, right) => Number(categoryRank.get(left.category_id)) - Number(categoryRank.get(right.category_id)))
  const settings = stored.settings
  return applyCatalogTranslations({
    categories,
    products,
    settings: {
      ...settings,
      applications: isNavigation || isSearch ? [] : localizedOptions(stored.applications, locale),
      concentrations: isNavigation || isSearch ? [] : localizedOptions(stored.concentrations, locale),
      blocks: page === 'products' ? settings.blocks ?? [] : [],
    },
  }, resolveTranslationDefinitions(getCatalogSeedTranslationDefinitions(), stored.translations), locale)
}

async function getCatalogPayload(locale: CmsLocale, page: string) {
  const definitions = getCertificationTranslationDefinitions()
  const [catalog, managedSetting, certificationData, translationEntities] = await Promise.all([
    getPublicCatalog(locale, page),
    page === 'products' ? cache.rememberForever(contentCacheKeyForSetting('products'), async () => (await WebsiteSetting.where('setting_key', 'products').firstJson())?.value ?? null) : Promise.resolve(null),
    cache.rememberForever(contentCacheKeyForPage('certifications', locale), async () => Promise.all([
      CertificationModel.with({translations: query => query.where('locale', locale)}).where('published', true).orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      CertificationTypeModel.with({translations: query => query.where('locale', locale)}).orderBy('id').getJson() as unknown as Promise<Row[]>,
    ])),
    cache.rememberForever(contentCacheKeyForPage('catalog-labels', locale), () => ContentTranslation.with({values: query => query.where('locale', locale)})
      .where(query => query.whereIn('translation_key', definitions.map(entry => entry.key)).orWhere(group => group.whereIn('source', definitions.map(entry => entry.source))))
      .getJson() as unknown as Promise<Row[]>),
  ])
  const [certificationRows, certificationTypeRows] = certificationData
  const certifications: Certification[] = certificationRows.map(row => ({
    id: Number(row.id), type_id: Number(row.type_id), holder: row.holder as Certification['holder'], status: row.status as Certification['status'], published: true, sort_order: Number(row.sort_order),
    content: {scope: Object.fromEntries((row.translations as Row[]).map(item => [String(item.locale), String(item.scope)])) as Certification['content']['scope'], target_date: databaseDate(row.target_date), issue_date: databaseDate(row.issue_date), expiry_date: databaseDate(row.expiry_date), certificate_number: String(row.certificate_number), document: String(row.document)},
  }))
  const typeIds = new Set(certifications.map(record => record.type_id))
  const types: CertificationType[] = certificationTypeRows.filter(row => typeIds.has(Number(row.id))).map(row => ({
    id: Number(row.id), slug: String(row.slug), content: {kind: row.kind, logo: row.logo, badge: row.badge, name: Object.fromEntries((row.translations as Row[]).map(item => [String(item.locale), String(item.name)])), description: Object.fromEntries((row.translations as Row[]).map(item => [String(item.locale), String(item.description)]))},
  } as CertificationType))
  const translations: TranslationEntry[] = translationEntities.map(row => ({key: String(row.translation_key), page: String(row.page), source: String(row.source), translations: {[locale]: String((row.values as Row[])[0]?.value ?? '')} as TranslationEntry['translations']}))
  const values = Object.fromEntries(resolveTranslationDefinitions(definitions, translations).map(entry => [entry.key.replace('certification.interface.', ''), entry.translations[locale]]))
  return {
    catalog,
    managedContent: managedSetting ? requireContent<ManagedPageContent>(managedSetting, 'Products page') : null,
    certifications: {certifications, types},
    certificationLabels: buildCertificationInterfaceLabels(values),
  }
}

export async function payload(request: Request) {
  try {
    const search = new URL(request.url).searchParams
    const {locale} = await validate({locale: search.get('locale')?.trim()}, schema({locale: field.string().required().in(['en','ar','fr'])}))
    const data = await getCatalogPayload(locale, search.get('page') ?? 'products')
    return Response.json({data}, {headers: {'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'}})
  } catch (error) {
    if (isValidationException(error)) return Response.json({message: error.message}, {status: error.status})
    console.error('Public catalog request failed', error)
    return Response.json({message: 'Unable to load content.'}, {status: 500})
  }
}
