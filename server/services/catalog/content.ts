import 'server-only'

import {DB} from '@holo-js/db'
import {getTranslationRows} from '@/server/services/translations'
import {decodeStoredJson} from '@/lib/cms/stored-json'
import type {Catalog, CatalogSettings, Category, Product} from '@/lib/catalog/contracts'
import {applyCatalogTranslations} from '@/lib/catalog/translations'
import {getCatalogFilters, getProductFilterAssignments, translatedCatalogContent} from '@/server/services/catalog/records'

export const decode = decodeStoredJson

export const getCatalog = async (includeDrafts = false): Promise<Catalog> => {
  const [categoryRows, productRows, categoryTranslations, productTranslations, settingsRow, translations, filters] = await Promise.all([
    DB.table('product_categories').orderBy('sort_order').orderBy('id').get(),
    DB.table('products').orderBy('sort_order').orderBy('id').get(),
    DB.table('product_category_translations').get(),
    DB.table('product_translations').get(),
    DB.table('website_settings').where('setting_key', 'catalog').first(),
    getTranslationRows('products'),
    getCatalogFilters(),
  ])
  if (!settingsRow) throw new Error('Catalog content is missing. Run the product_catalog seeder.')
  const assignments = await getProductFilterAssignments(productRows.map(row => Number(row.id)), true)
  const categories: Category[] = categoryRows.map(row => ({
    id: Number(row.id),
    slug: String(row.slug),
    published: Boolean(row.published),
    sort_order: Number(row.sort_order),
    content: {
      ...translatedCatalogContent(categoryTranslations.filter(translation => Number(translation.category_id) === Number(row.id))),
      seedKey: String(row.seed_key),
    } as Category['content'],
  })).filter(row => includeDrafts || row.published)
  const categoryIds = new Set(categories.map(category => category.id))
  const products: Product[] = productRows.map(row => ({
    id: Number(row.id),
    category_id: Number(row.category_id),
    slug: String(row.slug),
    published: Boolean(row.published),
    sort_order: Number(row.sort_order),
    content: {
      ...translatedCatalogContent(productTranslations.filter(translation => Number(translation.product_id) === Number(row.id))),
      ...assignments.get(Number(row.id)),
      seedKey: String(row.seed_key),
    } as Product['content'],
  })).filter(row => (includeDrafts || row.published) && categoryIds.has(row.category_id))
  const populatedCategoryIds = new Set(products.map(product => product.category_id))
  return applyCatalogTranslations({
    categories: includeDrafts ? categories : categories.filter(category => populatedCategoryIds.has(category.id)),
    products,
    settings: {...decode<CatalogSettings>(settingsRow.value), ...filters},
  }, translations)
}
