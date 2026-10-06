import {resolveMediaReferences} from '@/server/support/media-references'
import 'server-only'

import cache from '@holo-js/cache'
import type {HomeCmsData, WebsiteSettings, ManagedPageContent} from '@/lib/cms/contracts'
import type {CatalogSettings, CategoryContent, ProductContent} from '@/lib/catalog/contracts'
import {requireContent} from '@/lib/cms/stored-json'
import {getTranslationDefinitions, resolveTranslationDefinitions, type TranslationEntry} from '@/lib/translation-catalog'
import {getEnquiryInterfaceDefinitions} from '@/server/db/seed-data/enquiry-interface-definitions'
import {getCatalogSeedTranslationDefinitions} from '@/server/db/seed-data/catalog-translation-definitions'
import {buildEnquiryInterfaceLabels} from '@/server/services/enquiries/interface'
import {contentCacheKeyForPage} from '@/server/support/cache-keys'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import HomeSection from '@/server/models/HomeSection'
import ProductCategory from '@/server/models/ProductCategory'
import Product from '@/server/models/Product'
import ContentTranslation from '@/server/models/ContentTranslation'
import '@/server/models/ProductCategoryTranslation'
import '@/server/models/ProductTranslation'
import '@/server/models/ContentTranslationValue'
import {field, schema, validate, isValidationException} from '@holo-js/forms'
import {applyCatalogTranslations} from '@/lib/catalog/translations'

type Row = Record<string, unknown>

export async function GET(request: Request) {
  try {
    const search = new URL(request.url).searchParams
    const {locale} = await validate({locale: search.get('locale')?.trim()}, schema({locale: field.string().required().in(['en','ar','fr'])}))
    const data = await cache.rememberForever(contentCacheKeyForPage('layout', locale), async () => {
    const enquiryDefinitions = getEnquiryInterfaceDefinitions()
    const notFoundDefinitions = getTranslationDefinitions().filter(entry => entry.page === '404')
    const productDefinitions = getCatalogSeedTranslationDefinitions()
    const definitions = [...enquiryDefinitions, ...notFoundDefinitions, ...productDefinitions]
    const [settings, sections, categories, products, translationEntities] = await Promise.all([
      WebsiteSetting.whereIn('setting_key', ['website', 'catalog', '404', 'home_seo']).getJson(),
      HomeSection.where('enabled', true).whereIn('section_key', ['header', 'footer', 'overlays']).orderBy('sort_order').orderBy('id').getJson(),
      ProductCategory.with({translations: query => query.where('locale', locale)}).where('published', true)
        .whereHas('products', query => query.where('published', true)).orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      Product.with({translations: query => query.where('locale', locale)}).where('published', true)
        .whereHas('category', query => query.where('published', true)).orderBy('category_id').orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      ContentTranslation.with({values: query => query.where('locale', locale)})
        .where(query => query.whereIn('translation_key', definitions.map(entry => entry.key)).orWhere(group => group.whereIn('source', definitions.map(entry => entry.source))))
        .orderBy('translation_key').getJson() as unknown as Promise<Row[]>,
    ])
    const setting = (key: string) => requireContent(settings.find(row => row.setting_key === key)?.value, key)
    const translations: TranslationEntry[] = translationEntities.map(row => ({
      key: String(row.translation_key),
      page: String(row.page),
      source: String(row.source),
      translations: {[locale]: String((row.values as Row[])[0]?.value ?? '')} as TranslationEntry['translations'],
    }))
    const categoryRows = categories.map(row => {
      const translated = (row.translations as Row[])[0]
      const content = requireContent<CategoryContent>(translated.content, 'Category')
      return {
        id: Number(row.id), slug: String(row.slug), published: true, sort_order: Number(row.sort_order),
        content: {name: {[locale]: String(translated.name)}, description: {[locale]: String(translated.description)}, icon: content.icon, artwork: content.artwork, page: {blocks: []}} as unknown as CategoryContent,
      }
    })
    const categoryRank = new Map(categoryRows.map((row, index) => [row.id, index]))
    const productRows = products.map(row => {
      const translated = (row.translations as Row[])[0]
      const content = requireContent<ProductContent>(translated.content, 'Product')
      return {id: Number(row.id), category_id: Number(row.category_id), slug: String(row.slug), published: true, sort_order: Number(row.sort_order), content: {name: {[locale]: String(translated.name)}, gallery: content.gallery.slice(0, 1), page: {blocks: []}} as unknown as ProductContent}
    }).sort((left, right) => Number(categoryRank.get(left.category_id)) - Number(categoryRank.get(right.category_id)))
    const catalogSettings = setting('catalog') as CatalogSettings
    const catalog = applyCatalogTranslations({categories: categoryRows, products: productRows, settings: {...catalogSettings, blocks: [], applications: [], concentrations: []}}, resolveTranslationDefinitions(productDefinitions, translations), locale)
    const values = Object.fromEntries(resolveTranslationDefinitions(enquiryDefinitions, translations).map(entry => [entry.key.replace('enquiry.interface.', ''), entry.translations[locale]]))
    return {
      settings: setting('website') as WebsiteSettings,
      home: {
        sections: sections.map(row => ({...requireContent(row.content, 'Homepage section'), key: String(row.section_key), label: String(row.label), enabled: true})) as HomeCmsData['sections'],
        seo: setting('home_seo') as HomeCmsData['seo'],
      },
      catalog,
      enquiryLabels: buildEnquiryInterfaceLabels(values),
      notFound: setting('404') as ManagedPageContent,
      notFoundTranslations: resolveTranslationDefinitions(notFoundDefinitions, translations),
    }
    })
    return Response.json({data: await resolveMediaReferences(data)}, {headers: {'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'}})
  } catch (error) {
    if (isValidationException(error)) return Response.json({message: error.message}, {status: error.status})
    console.error('Public layout request failed', error)
    return Response.json({message: 'Unable to load content.'}, {status: 500})
  }
}
