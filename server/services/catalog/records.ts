import 'server-only'
import type {CmsLocale} from '@/lib/cms/contracts'
import {decodeStoredJson} from '@/lib/cms/stored-json'
import type {CategoryContent, ProductContent, FilterOption} from '@/lib/catalog/contracts'
import {mergeContent} from '@/lib/catalog/localized-content'
import ProductApplication from '@/server/models/ProductApplication'
import ConcentrationRange from '@/server/models/ConcentrationRange'
import Product from '@/server/models/Product'
import '@/server/models/ProductApplicationTranslation'
import '@/server/models/ConcentrationRangeTranslation'

export function translatedCatalogContent(rows: Record<string, unknown>[]): CategoryContent | ProductContent {
  let content: unknown = {}
  for (const row of rows) {
    const locale = String(row.locale)
    content = mergeContent(content, {
      ...decodeStoredJson<Record<string, unknown>>(row.content),
      name: {[locale]: row.name},
      description: {[locale]: row.description},
      seo: {title: {[locale]: row.seo_title}, description: {[locale]: row.seo_description}},
    })
  }
  return content as CategoryContent | ProductContent
}

export async function getCatalogFilters(locale?: CmsLocale) {
  let applications = ProductApplication.with({translations: query => locale ? query.where('locale', locale) : query}).orderBy('sort_order').orderBy('id')
  let concentrations = ConcentrationRange.with({translations: query => locale ? query.where('locale', locale) : query}).orderBy('sort_order').orderBy('id')
  if (locale) {
    applications = applications.where('is_active', true)
    concentrations = concentrations.where('is_active', true)
  }
  const [applicationRows, concentrationRows] = await Promise.all([
    applications.getJson() as unknown as Promise<Record<string, unknown>[]>,
    concentrations.getJson() as unknown as Promise<Record<string, unknown>[]>,
  ])
  const options = (rows: Record<string, unknown>[]): FilterOption[] => rows.map(row => ({
    id: String(row.slug),
    label: Object.fromEntries((row.translations as Record<string, unknown>[]).map(translation => [String(translation.locale), String(translation.name)])) as FilterOption['label'],
  }))
  return {applications: options(applicationRows), concentrations: options(concentrationRows)}
}

export async function getProductFilterAssignments(productIds: number[], includeInactive = false) {
  const result = new Map<number, {applications: string[]; concentrations: string[]}>()
  for (const id of productIds) result.set(id, {applications: [], concentrations: []})
  if (!productIds.length) return result
  const products = await Product.with({
    applications: query => includeInactive ? query : query.where('is_active', true),
    concentrations: query => includeInactive ? query : query.where('is_active', true),
  }).whereIn('id', productIds).getJson() as unknown as Record<string, unknown>[]
  for (const product of products) {
    const assignment = result.get(Number(product.id))!
    assignment.applications = (product.applications as Record<string, unknown>[]).map(row => String(row.slug))
    assignment.concentrations = (product.concentrations as Record<string, unknown>[]).map(row => String(row.slug))
  }
  return result
}
