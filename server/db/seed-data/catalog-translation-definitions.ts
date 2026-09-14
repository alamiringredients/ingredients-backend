import {createHash} from 'node:crypto'
import type {LocalizedValue} from '@/lib/cms/contracts'
import {getCatalogSeedContent} from './catalog-seed-content'

export type CatalogTranslationDefinition={key:string;page:'products';source:string;translations:LocalizedValue}

const sectionKey=(source:string)=>`products.section.${createHash('sha1').update(source).digest('hex').slice(0,12)}`

export function getCatalogSeedTranslationDefinitions():CatalogTranslationDefinition[] {
  const catalog=getCatalogSeedContent()
  const definitions:CatalogTranslationDefinition[]=[]
  for(const [key,translations] of Object.entries(catalog.settings.labels)) definitions.push({key:`products.interface.${key}`,page:'products',source:translations.en,translations})
  const sectionLabels=new Map<string,LocalizedValue>()
  for(const record of [...catalog.categories,...catalog.products]) for(const block of record.content.page.blocks) {
    if(block.key.startsWith('fold-')&&block.label) sectionLabels.set(block.label,block.texts.find(field=>field.source===block.label)?.values??{en:block.label,ar:block.label,fr:block.label})
  }
  for(const [source,translations] of sectionLabels) definitions.push({key:sectionKey(source),page:'products',source,translations})
  return definitions
}
