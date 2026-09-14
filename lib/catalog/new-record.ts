import {emptyLocalizedDocument} from '@/lib/cms/document'
import {emptyLocalized, type Category, type Product} from './contracts'

export function newCatalogRecord(kind:'product', source:Product, categoryId?:number):Product
export function newCatalogRecord(kind:'category', source:Category):Category
export function newCatalogRecord(kind:'product'|'category', source:Category|Product, categoryId=0):Category|Product {
  const record:Category|Product=structuredClone(source)
  record.id=0
  record.slug=''
  record.published=true
  record.sort_order=0
  delete record.content.seedKey
  record.content.name=emptyLocalized()
  record.content.description=emptyLocalized()
  record.content.seo={title:emptyLocalized(),description:emptyLocalized()}
  record.content.artwork.texts.forEach(field=>{field.values=emptyLocalized()})
  record.content.artwork.assets.forEach(asset=>{asset.value=''})
  const sectionLabels=kind==='product' ? ['Header','Product details','Gallery','Related products','Next step','All products dialog'] : ['Header','Product range','Gallery','Certification','All products dialog']
  for(const block of record.content.page.blocks) {
    if(block.key.startsWith('section-')) block.label=sectionLabels[Number(block.key.slice(8))] ?? 'Page section' 
    block.enabled=block.key==='section-0'||block.key==='section-1'
    if (block.items) block.items=[]
    block.links.forEach(link=>{link.value=''})
    block.texts.forEach(field=>{field.values=emptyLocalized()})
    block.assets.forEach(asset=>{asset.value=''})
  }
  if(kind==='product') {
    const product=record as Product
    product.category_id=categoryId
    product.content.applications=[]
    product.content.concentrations=[]
    product.content.gallery=[]
    product.content.tds=emptyLocalized()
  } else {
    const category=record as Category
    category.content.artwork.assets=[]
    category.content.pageCopy={heroHeading:emptyLocalizedDocument(),introHeading:emptyLocalizedDocument(),heroTitle:emptyLocalized(),heroAccent:emptyLocalized(),heroDescription:emptyLocalized(),introTitle:emptyLocalized(),introAccent:emptyLocalized(),introDescription:emptyLocalized()}
    category.content.icon=''
    category.content.gallery=[]
  }
  return record
}
