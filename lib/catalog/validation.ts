import {isDecorativeField} from '@/lib/cms/decorative-fields'
import {cmsLocales, type LocalizedValue} from '@/lib/cms/contracts'
import {MAX_CATEGORY_ARTWORK_IMAGES,type CatalogBlock,type CatalogPageContent} from './contracts'
import {localizedDocument} from '@/lib/cms/document'
import {textContent} from '@/lib/editor/document'
import {removeInternalNavigationLinks} from '@/lib/cms/navigation-links'
export function localizedValue(value: unknown, label: string, required = false): LocalizedValue {
  if (!value || typeof value !== 'object') throw new Error(`${label}: enter all three locales.`)
  const result = Object.fromEntries(cmsLocales.map((locale) => {
    const text = (value as Record<string, unknown>)[locale]
    if (typeof text !== 'string' || text.length > 30000) throw new Error(`${label}: invalid ${locale} content.`)
    return [locale, text]
  })) as LocalizedValue
  if ((required || cmsLocales.some((locale) => result[locale].trim())) && cmsLocales.some((locale) => !result[locale].trim())) throw new Error(`${label}: enter EN, AR and FR, or clear all three for optional content.`)
  return result
}
export function safeUrl(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048 || ([...value].some(character => character.charCodeAt(0) < 32) || value.includes('\\'))) throw new Error('Invalid file or link URL.')
  if (value && !/^(\/(?!\/)|https?:\/\/|mailto:|tel:|#)/i.test(value)) throw new Error('Use a website path or an HTTP or HTTPS URL.')
  return value
}
export function validateBlock(input: CatalogBlock, original: CatalogBlock): CatalogBlock {
  if (!input || typeof input.enabled !== 'boolean' || !Array.isArray(input.texts) || !Array.isArray(input.assets) || !Array.isArray(input.links)) throw new Error('Invalid page section.')
  let items
  if (input.items !== undefined) {
    if (!Array.isArray(input.items) || input.items.length > 50) throw new Error('A section can contain up to 50 items.')
    items=input.items.map((item,index)=>{
      const document=item.document?localizedDocument(item.document):undefined
      return {
      ...(document?{document}:{}),
      ...(item.label?{label:localizedValue(item.label,`Item ${index+1} label`,true)}:{}),
      value:localizedValue(document?Object.fromEntries(cmsLocales.map(locale=>[locale,textContent(document[locale])])):item.value,`Item ${index+1}`,true),
    }})
  }
  return {...original, enabled:input.enabled, ...(items?{items}:{}),
    texts:original.texts.filter(field=>!isDecorativeField(field.source)).map((field) => ({...field, values:localizedValue(input.texts.find((item) => item.id === field.id)?.values, field.label)})),
    assets:original.assets.map((field) => ({...field, value:safeUrl(input.assets.find((item) => item.id === field.id)?.value)})),
    links:removeInternalNavigationLinks({links:original.links.map((field) => ({...field, value:safeUrl(input.links.find((item) => item.id === field.id)?.value)}))}).links,
  }
}
export function validateArtworkBlock(input:CatalogBlock,original:CatalogBlock):CatalogBlock {
  if(!input||!Array.isArray(input.assets)||input.assets.length>MAX_CATEGORY_ARTWORK_IMAGES)throw new Error(`Homepage card artwork can contain up to ${MAX_CATEGORY_ARTWORK_IMAGES} images.`)
  const block=validateBlock({...input,assets:original.assets},original)
  const ids=new Set<string>()
  const assets=input.assets.map((asset,index)=>{
    if(!asset||typeof asset!=='object')throw new Error(`Artwork image ${index+1} is invalid.`)
    const value=safeUrl(asset.value)
    if(!value)throw new Error(`Artwork image ${index+1}: choose an image.`)
    const saved=original.assets.find(item=>item.id===asset.id)
    const id=saved?.id??(/^artwork-[a-f0-9-]{36}$/.test(asset.id)?asset.id:`artwork-${index+1}`)
    if(ids.has(id))throw new Error('Homepage card artwork images must be unique.')
    ids.add(id)
    return {id,label:`Image ${index+1}`,kind:'image' as const,source:saved?.source??id,value}
  })
  return {...block,assets}
}
export function validatePage(input: CatalogPageContent, original: CatalogPageContent): CatalogPageContent {
  if (!input || !Array.isArray(input.blocks)) throw new Error('Invalid page content.')
  return {blocks:original.blocks.map((block) => validateBlock(input.blocks.find((item) => item.key === block.key)!, block))}
}
