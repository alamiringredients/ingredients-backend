import {contentUrl,textContent,validateDocument} from '@/lib/editor/document'
import {newsLocales,newsPageSectionKeys,type NewsContent,type NewsVersion,type NewsPageContent,type NewsTaxonomy} from './contracts'
import {sectionVisibility} from '@/lib/cms/section-visibility'
export function newsSlug(input:unknown):string {if(typeof input!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input)||input.length>160)throw new Error('Use a lowercase slug with letters, numbers, and hyphens.');return input}
const str=(v:unknown,max=5000)=>{if(typeof v!=='string'||v.length>max)throw new Error('Invalid text field.');return v}
export function validateVersion(input:unknown,publishing=false):NewsVersion {
  if(!input||typeof input!=='object')throw new Error('Article translation is required.')
  const i=input as NewsVersion
  const title=validateDocument(i.title)
  if(title.content.some(n=>!['paragraph','heading'].includes(n.type)))throw new Error('Titles can only contain text and emphasis.')
  const body=validateDocument(i.body)
  const cardTitle=validateDocument(i.cardTitle)
  if(cardTitle.content.some(n=>!n.content?.every(c=>['text','hardBreak'].includes(c.type))&&n.content?.length))throw new Error('Card titles can only contain text.')
  const out={title,body,cardTitle,cardSummary:str(i.cardSummary),hero:contentUrl(i.hero,true),summary:str(i.summary),heroAlt:str(i.heroAlt),heroCaption:str(i.heroCaption),seoTitle:str(i.seoTitle),seoDescription:str(i.seoDescription)}
  if(publishing&&(!textContent(title).trim()||!textContent(body).trim()||!out.summary.trim()||!out.seoTitle.trim()))throw new Error('Add a title, summary, body, and SEO title before publishing this language.')
  if(publishing&&out.hero&&!out.heroAlt.trim())throw new Error('Add alt text for the lead image.')
  return out
}
export function validateNewsContent(input:unknown):NewsContent {
  if(!input||typeof input!=='object')throw new Error('Article content is required.')
  const i=input as NewsContent
  if(!Number.isSafeInteger(i.categoryId)||i.categoryId<0||!Array.isArray(i.tagIds)||i.tagIds.some(id=>!Number.isSafeInteger(id)||id<1)||i.tagIds.length>30)throw new Error('Choose valid categories and tags.')
  if(typeof i.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(i.date)||Number.isNaN(Date.parse(i.date)))throw new Error('Choose a valid publication date.')
  if(!Array.isArray(i.relatedSlugs)||i.relatedSlugs.length>3)throw new Error('Choose up to three related articles.')
  return {relatedSlugs:[...new Set(i.relatedSlugs.map(newsSlug))],categoryId:i.categoryId,tagIds:[...new Set(i.tagIds)],date:i.date,featured:Boolean(i.featured),previousSlug:i.previousSlug?newsSlug(i.previousSlug):'',nextSlug:i.nextSlug?newsSlug(i.nextSlug):'',locales:Object.fromEntries(newsLocales.map(l=>[l,validateVersion(i.locales?.[l])])) as NewsContent['locales']}
}
export function validateTaxonomy(input:unknown):Omit<NewsTaxonomy,'id'> {
  const i=input as NewsTaxonomy
  if(!i||!['category','tag'].includes(i.kind)||!Number.isSafeInteger(i.sort_order))throw new Error('Invalid category or tag.')
  return {kind:i.kind,slug:newsSlug(i.slug),sort_order:i.sort_order,content:Object.fromEntries(newsLocales.map(l=>{const v=i.content?.[l];if(!v?.name.trim())throw new Error(`Add the ${l.toUpperCase()} name.`);return [l,{name:str(v.name,200),description:str(v.description)}]})) as NewsTaxonomy['content']}
}
export function validateNewsPage(input:unknown):NewsPageContent {
  const page=input as NewsPageContent
  const out={sectionVisibility:sectionVisibility(page?.sectionVisibility,newsPageSectionKeys)} as NewsPageContent
  for(const l of newsLocales) {
    const i=page?.[l]
    if(!i)throw new Error('All page languages are required.')
    out[l]={...Object.fromEntries(['kicker','description','heroAlt','empty','relatedKicker','contactKicker','contactDescription','eventsKicker','eventsDescription','seoTitle','seoDescription'].map(k=>[k,str(i[k as keyof typeof i])])),hero:contentUrl(i.hero,true),title:validateDocument(i.title),relatedTitle:validateDocument(i.relatedTitle),contactTitle:validateDocument(i.contactTitle),eventsTitle:validateDocument(i.eventsTitle)} as NewsPageContent[typeof l]
  }
  return out
}
