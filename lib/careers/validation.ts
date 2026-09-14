import {validateDocument,contentUrl} from '@/lib/editor/document'
import {cmsLocales} from '@/lib/cms/contracts'
import {aboutSectionKeys,careersSectionKeys,type JobRecord,type AboutContent,type CareersContent} from './contracts'
import {sectionVisibility} from '@/lib/cms/section-visibility'
export function validateJob(raw:unknown):Omit<JobRecord,'id'>{
 const value=raw as JobRecord
 if(!value||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)||value.slug.length>150||!['open','closed','draft'].includes(value.status)||typeof value.code!=='string'||value.code.length>20)throw new Error('Enter a valid slug, code and status.')
 for(const locale of cmsLocales){
  const v=value.content?.[locale]
  if(!v)throw new Error('Complete all languages.')
  for(const field of ['title','summary','department','location','contract','experience','reportsTo','closing','heroAlt'] as const)if(typeof v[field]!=='string'||v[field].length>5000||(!v[field].trim()&&['title','summary','department','location'].includes(field)))throw new Error(`Complete ${field} in ${locale.toUpperCase()}.`)
  v.hero=contentUrl(v.hero,true);v.body=validateDocument(v.body)
 }
 return {slug:value.slug,code:value.code,status:value.status,content:value.content}
}
function validateLocalizedText(value:unknown){
 const texts=value as Record<string,unknown>|null
 for(const locale of cmsLocales)if(typeof texts?.[locale]!=='string'||(texts[locale] as string).length>5000)throw new Error('Complete text in all languages (maximum 5,000 characters).')
}
export function validateAbout(raw:AboutContent){
 raw.sectionVisibility=sectionVisibility(raw.sectionVisibility,aboutSectionKeys)
 validateHero(raw.hero)
 for(const locale of cmsLocales)raw.body[locale]=validateDocument(raw.body[locale])
 return raw
}
function validateHero(hero:AboutContent['hero']){
 if(!hero)throw new Error('Hero is required.')
 hero.image=contentUrl(hero.image,true)
 validateLocalizedText(hero.kicker);validateLocalizedText(hero.alt)
 for(const locale of cmsLocales){hero.title[locale]=validateDocument(hero.title[locale]);hero.description[locale]=validateDocument(hero.description[locale]);if(typeof hero.kicker[locale]!=='string'||typeof hero.alt[locale]!=='string')throw new Error('Complete hero text.')}
}
export function validateCareersPage(raw:CareersContent){
 raw.sectionVisibility=sectionVisibility(raw.sectionVisibility,careersSectionKeys)
 raw.newsImage=contentUrl(raw.newsImage,true)
 validateLocalizedText(raw.newsImageAlt)
 validateHero(raw.hero)
 for(const key of ['newsKicker','jobsKicker','applyKicker','empty'] as const)validateLocalizedText(raw[key])
 if(!Array.isArray(raw.newsIds)||raw.newsIds.length!==3||new Set(raw.newsIds).size!==3||raw.newsIds.some(id=>!Number.isSafeInteger(id)||id<1))throw new Error('Select three different News articles.')
 for(const key of ['newsTitle','newsIntro','jobsTitle','jobsIntro','applyTitle','applyIntro'] as const)for(const locale of cmsLocales)raw[key][locale]=validateDocument(raw[key][locale])
 return raw
}
