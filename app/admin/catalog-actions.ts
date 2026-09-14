'use server'

import { requireAdminPermission } from '@/server/admin/authorization'
import { adminActionError,redirectCreatedRecord } from '@/server/admin/form-actions'
import { decode, getCatalog } from '@/server/services/catalog/content'
import {DB} from '@holo-js/db'
import {getCatalogFilters} from '@/server/services/catalog/records'
import { newCatalogRecord } from '@/lib/catalog/new-record'
import type { CategoryContent,ProductContent } from '@/lib/catalog/contracts'
import { localizedValue,safeUrl,validateArtworkBlock,validateBlock,validatePage } from '@/lib/catalog/validation'
import { localizedDocument } from '@/lib/cms/document'
import {validate} from '@holo-js/forms'
import {categoryForm,productForm} from '@/app/admin/catalog-schema'
import Product from '@/server/models/Product'
import ProductCategory from '@/server/models/ProductCategory'
import ProductApplication from '@/server/models/ProductApplication'
import ConcentrationRange from '@/server/models/ConcentrationRange'
import ProductTranslation from '@/server/models/ProductTranslation'
import ProductCategoryTranslation from '@/server/models/ProductCategoryTranslation'
import {cmsLocales} from '@/lib/cms/contracts'
import {localizeContent} from '@/lib/catalog/localized-content'
import { revalidatePath } from 'next/cache'

function refresh() {  revalidatePath('/admin', 'layout') }
function validateGallery(input:unknown) {
  if (!Array.isArray(input)||input.length>24) throw new Error('A gallery can contain up to 24 images.')
  return input.map((item:unknown,index:number)=>{
    if (!item||typeof item!=='object') throw new Error(`Gallery image ${index+1} is invalid.`)
    const value=item as {image?:unknown;caption?:unknown}
    const image=safeUrl(value.image)
    if (!image) throw new Error(`Gallery image ${index+1}: choose an image.`)
    return {image,caption:localizedValue(value.caption,`Gallery image ${index+1} caption`,true)}
  })
}
export async function saveCatalogRecord(kind:'product'|'category',id:number,payload:string) {
  try {
    await requireAdminPermission(kind === 'product' ? 'products' : 'product_categories', id ? 'edit' : 'create')
    if (payload.length > 2000000) throw new Error('Catalog content is too large.')
    if (kind !== 'product' && kind !== 'category') throw new Error('Unknown catalog type.')
    const submitted=JSON.parse(payload)
    const input={...submitted,...await validate(submitted,kind==='product'?productForm:categoryForm)}
    if (!Number.isSafeInteger(id) || id < 0) throw new Error('Invalid record ID.')
    let savedId=id
    const catalog = await getCatalog(true)
    const records = kind === 'product' ? catalog.products : catalog.categories
    const record = id ? records.find(row => row.id === id) : records[0] ? kind === 'product' ? newCatalogRecord('product', catalog.products[0]) : newCatalogRecord('category', catalog.categories[0]) : undefined
    if (!record) throw new Error('Record no longer exists.')
    if (typeof input.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 150) throw new Error('Use lowercase letters, numbers and hyphens for the URL slug.')
    if (typeof input.published !== 'boolean' || !Number.isSafeInteger(input.sort_order)) throw new Error('Invalid publication or display order.')
    const duplicateQuery = kind === 'product' ? Product.where('slug',input.slug).where('category_id',input.category_id) : ProductCategory.where('slug',input.slug)
    const duplicate = await duplicateQuery.firstJson()
    if(duplicate && Number(duplicate.id)!==id) return {ok:false,message:'Please correct the highlighted fields.',errors:{slug:['This URL slug is already in use. Choose another.']}}
    const original = decode<CategoryContent | ProductContent>(record.content)
    const content = {seedKey:original.seedKey, name:localizedValue(input.content.name, 'Name', true), description:localizedValue(input.content.description, 'Card description'), seo:{title:localizedValue(input.content.seo?.title,'SEO title'),description:localizedValue(input.content.seo?.description,'SEO description')}, artwork:kind==='category'?validateArtworkBlock(input.content.artwork,original.artwork):validateBlock(input.content.artwork, original.artwork), page:validatePage(input.content.page, original.page)}
    if (kind === 'product') {
      if (!Number.isSafeInteger(input.category_id) || !await ProductCategory.where('id', input.category_id).firstJson()) return {ok:false,message:'Please correct the highlighted fields.',errors:{category_id:['Choose an existing category.']}}
      const filters = await getCatalogFilters()
      for (const key of ['applications', 'concentrations'] as const) {
        if (!Array.isArray(input.content[key]) || input.content[key].some((id: unknown) => !filters[key].some((option) => option.id === id))) throw new Error(`Choose valid ${key}.`)
      }
      const tds = {en:safeUrl(input.content.tds?.en ?? ''), ar:safeUrl(input.content.tds?.ar ?? ''), fr:safeUrl(input.content.tds?.fr ?? '')}
      const gallery=validateGallery(input.content.gallery)
      const productContent: ProductContent = {...content, applications:input.content.applications, concentrations:input.content.concentrations, gallery, tds}
      const values = {category_id:input.category_id, slug:input.slug, published:input.published, sort_order:input.sort_order, content:productContent}
      savedId = await persist('product', id, values)
    } else {
      const categoryContent:CategoryContent={...content,pageCopy:{heroHeading:localizedDocument(input.content.pageCopy?.heroHeading),introHeading:localizedDocument(input.content.pageCopy?.introHeading),heroTitle:localizedValue(input.content.pageCopy?.heroTitle,'Hero title'),heroAccent:localizedValue(input.content.pageCopy?.heroAccent,'Highlighted hero title'),heroDescription:localizedValue(input.content.pageCopy?.heroDescription,'Hero description'),introTitle:localizedValue(input.content.pageCopy?.introTitle,'Introduction title'),introAccent:localizedValue(input.content.pageCopy?.introAccent,'Highlighted introduction title'),introDescription:localizedValue(input.content.pageCopy?.introDescription,'Introduction description')},icon:safeUrl(input.content.icon),gallery:validateGallery(input.content.gallery)}
      const values = {slug:input.slug, published:input.published, sort_order:input.sort_order, content:categoryContent}
      savedId = await persist('category', id, values)
    }
    refresh();await redirectCreatedRecord(id,savedId,kind==='product'?'/admin/products':'/admin/product-categories',kind==='product'?'products':'product_categories');return {ok:true,message:'Saved.',id:savedId}
  } catch(error){return adminActionError(error)}
}
export async function deleteCatalogRecord(kind:'product'|'category',id:number) {
  try {
    await requireAdminPermission(kind === 'product' ? 'products' : 'product_categories', 'delete')
    if (kind === 'category') {
      if (await Product.where('category_id',id).firstJson()) throw new Error('Move or delete this category’s products first, including drafts.')
      await (await ProductCategory.findOrFail(id)).delete()
    } else if (kind === 'product') await (await Product.findOrFail(id)).delete()
    else throw new Error('Unknown catalog type.')
    refresh(); return {ok:true, message:'Deleted.'}
  } catch(error){return adminActionError(error)}
}

async function persist(kind: 'product' | 'category', id: number, values: {slug: string; published: boolean; sort_order: number; category_id?: number; content: ProductContent | CategoryContent}) {
  return DB.transaction(async () => {
    const {content, ...attributes} = values
    const {name, description, seo} = content
    const translatedContent = Object.fromEntries(Object.entries(content).filter(([key]) => !['name', 'description', 'seo', 'seedKey'].includes(key)))

    if (kind === 'product') {
      const productContent = content as ProductContent
      const productTranslation = Object.fromEntries(Object.entries(translatedContent).filter(([key]) => !['applications', 'concentrations'].includes(key)))
      const product = id
        ? await Product.findOrFail(id)
        : await Product.create(attributes)
      if (id) await product.update(attributes)

      for (const [relation, Model, slugs] of [
        ['applications', ProductApplication, productContent.applications],
        ['concentrations', ConcentrationRange, productContent.concentrations],
      ] as const) {
        const options = slugs.length ? await Model.whereIn('slug', [...new Set(slugs)]).get() : []
        if (options.length !== new Set(slugs).size) throw new Error(`Choose valid ${relation}.`)
        const ids = slugs.map(slug => Number(options.find(option => option.slug === slug)!.id))
        await product[relation]().sync(ids)
        for (const [sortOrder, optionId] of ids.entries()) {
          await product[relation]().updateExistingPivot(optionId, {sort_order: sortOrder})
        }
      }

      for (const locale of cmsLocales) {
        await ProductTranslation.upsert({product_id: Number(product.id), locale}, {
          name: name[locale],
          description: description[locale],
          seo_title: seo.title[locale],
          seo_description: seo.description[locale],
          content: localizeContent(productTranslation, locale),
        })
      }
      return Number(product.id)
    }

    const category = id
      ? await ProductCategory.findOrFail(id)
      : await ProductCategory.create(attributes)
    if (id) await category.update(attributes)
    for (const locale of cmsLocales) {
      await ProductCategoryTranslation.upsert({category_id: Number(category.id), locale}, {
        name: name[locale],
        description: description[locale],
        seo_title: seo.title[locale],
        seo_description: seo.description[locale],
        content: localizeContent(translatedContent, locale),
      })
    }
    return Number(category.id)
  })
}
