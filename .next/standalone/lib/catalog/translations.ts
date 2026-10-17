import type {CmsLocale} from '@/lib/cms/contracts'
import type {LocalizedValue} from '@/lib/cms/contracts'
import type {Catalog, CatalogBlock, CatalogSettings} from './contracts'

type TranslationRow = {translation_key?:unknown; key?:unknown; source?:unknown; en?:unknown; ar?:unknown; fr?:unknown; translations?:LocalizedValue}

function values(row:TranslationRow|undefined,key:string,locale?:CmsLocale):LocalizedValue {
  if(!row) throw new Error(`Catalog translation ${key} is missing from the database. Run the content_translations seeder.`)
  if(locale)return {[locale]:String(row.translations?.[locale]??row[locale]??'')} as LocalizedValue
  return {en:String(row.en??''),ar:String(row.ar??''),fr:String(row.fr??'')}
}

function translateFoldHeadings(blocks:CatalogBlock[],bySource:Map<string,TranslationRow>,locale?:CmsLocale) {
  return blocks.map(block=>{
    if(!block.key.startsWith('fold-')) return block
    const translated=values(bySource.get(block.label),block.label,locale)
    return {...block,texts:block.texts.map(field=>field.source===block.label?{...field,values:translated}:field)}
  })
}

export function applyCatalogTranslations(catalog:Catalog,rows:TranslationRow[],locale?:CmsLocale):Catalog {
  const byKey=new Map(rows.map(row=>[String(row.translation_key??row.key),row]))
  const bySource=new Map(rows.map(row=>[String(row.source),row]))
  const settings:CatalogSettings={
    ...catalog.settings,
    blocks:catalog.settings.blocks,
    labels:Object.fromEntries(Object.entries(catalog.settings.labels).map(([key])=>[key,values(byKey.get(`products.interface.${key}`),`products.interface.${key}`,locale)])) as CatalogSettings['labels'],
  }
  return {...catalog,settings,categories:catalog.categories.map(category=>({...category,content:{...category.content,page:{...category.content.page,blocks:translateFoldHeadings(category.content.page.blocks,bySource,locale)}}})),products:catalog.products.map(product=>({...product,content:{...product.content,page:{...product.content.page,blocks:translateFoldHeadings(product.content.page.blocks,bySource,locale)}}}))}
}
