import assert from 'node:assert/strict'
import {test} from 'node:test'
import {getHomePageSeedContent} from '../server/db/seeders/HomePageSeeder'
import {getWebsiteSettingsSeedContent} from '../server/db/seeders/WebsiteSettingsSeeder'
import {getDownloadsPageSeedContent} from '../server/db/seeders/DownloadsPageSeeder'
import {getCatalogSeedContent} from '../server/db/seed-data/catalog-seed-content'
import {getCertificationSeedContent} from '../server/db/seed-data/certification-seed-content'
import {mergeSeedContent,upgradeSeedContent} from '../server/db/seed-data/merge-seed-content'
import {sectionVisibility} from '../lib/cms/section-visibility'
import {getCatalogSeedTranslationDefinitions} from '../server/db/seed-data/catalog-translation-definitions'
import {getTranslationDefinitions} from '../lib/translation-catalog'
import {localizedDocuments,normalizeEventContent} from '../lib/events/content'
import {validateAbout} from '../lib/careers/validation'
import type {AboutContent} from '../lib/careers/contracts'
import {getEnquiryInterfaceDefinitions} from '../server/db/seed-data/enquiry-interface-definitions'
import {getContentTranslationDefinitions} from '../server/db/seed-data/content-translation-definitions'
import type {NewsPageContent} from '../lib/news/contracts'
import {validateNewsPage} from '../lib/news/validation'
import siteContent from '../server/db/seed-data/site-content.json'
import newsSeed from '../server/db/seed-data/news.json'

test('every admin-managed page seeder provides localized database content',()=>{
  const home=getHomePageSeedContent()
  const story=home.sections.find(section=>section.key==='story')!.texts.find(field=>field.source==='Our story')!.values
  const website=getWebsiteSettingsSeedContent()
  const downloads=getDownloadsPageSeedContent()
  const catalog=getCatalogSeedContent()
  const certifications=getCertificationSeedContent()
  assert.deepEqual(downloads.sectionVisibility,{hero:true,products:true,company:true})
  for(const value of [story,website.defaultSeoTitle,downloads.heroTitle,catalog.categories[0].content.name,catalog.products[0].content.name,certifications.types[0].content.description]) {
    assert.ok(value.en)
    assert.ok(value.ar)
    assert.ok(value.fr)
    assert.notEqual(value.ar,value.en)
    assert.notEqual(value.fr,value.en)
  }
})

test('shared seeder merge repairs copied English while retaining administrator edits',()=>{
  const seed={title:{en:'Title',ar:'العنوان',fr:'Titre'},sections:[{key:'hero',label:{en:'Hero',ar:'واجهة',fr:'Bannière'}}]}
  const current={title:{en:'Title',ar:'Title',fr:'Titre personnalisé'},sections:[{key:'hero',label:{en:'Hero',ar:'Hero',fr:'Hero'}}]}
  const merged=mergeSeedContent(current,seed)
  assert.deepEqual(merged.title,{en:'Title',ar:'العنوان',fr:'Titre personnalisé'})
  assert.deepEqual(merged.sections[0].label,{en:'Hero',ar:'واجهة',fr:'Bannière'})
})

test('seed upgrades replace old defaults without overwriting administrator edits',()=>{
  const previous={title:'Old title',body:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Old body'}]}]},caption:''}
  const next={title:'New title',body:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Full body'}]}]},caption:'New caption'}
  assert.deepEqual(upgradeSeedContent(previous,previous,next),next)
  assert.deepEqual(upgradeSeedContent({...previous,title:'Editor title'},previous,next),{...next,title:'Editor title'})
})

test('page records require every section visibility toggle',()=>{
  assert.deepEqual(sectionVisibility({hero:false,body:true},['hero','body'] as const),{hero:false,body:true})
  assert.throws(()=>sectionVisibility(undefined,['hero','body'] as const))
  assert.throws(()=>sectionVisibility({hero:false},['hero','body'] as const))
  assert.throws(()=>sectionVisibility({hero:'false'},['hero'] as const))
})

test('News page uses one shared hero image while keeping alternative text localized',()=>{
  const seed=siteContent.website_settings.find(setting=>setting.setting_key==='news')!.value as NewsPageContent
  assert.ok(seed.heroImage)
  assert.equal('hero' in seed.en,false)
  assert.notEqual(seed.en.heroAlt,seed.ar.heroAlt)
  assert.equal(newsSeed.page.heroImage,seed.heroImage)
  assert.equal('hero' in newsSeed.page.en,false)

  const saved=validateNewsPage(seed)
  assert.equal(saved.heroImage,seed.heroImage)
  assert.equal('hero' in saved.en,false)
})

test('Products page and event records use rich editor documents without translation-owned editorial copy',()=>{
  const products=siteContent.website_settings.find(setting=>setting.setting_key==='products')!.value
  assert.ok(products.sections.some(section=>(section.richTexts?.length??0)>0))
  assert.ok(getCatalogSeedTranslationDefinitions().every(definition=>!definition.key.startsWith('products.page.')))
  assert.ok(getTranslationDefinitions().every(definition=>definition.source!=='Gulfood Manufacturing.'))
  const text={en:'Event title',ar:'عنوان الفعالية',fr:"Titre de l’événement"}
  const content=normalizeEventContent({title:localizedDocuments(text,true),summary:text,body:localizedDocuments(text),heroCaption:text,seo:{}})
  assert.equal(content.title.en.type,'doc')
  assert.equal(content.body.en.type,'doc')
})

test('About body accepts blocks in any composition',()=>{
  const about=structuredClone(siteContent.website_settings.find(setting=>setting.setting_key==='about')!.value)
  const content=[
    {type:'paragraph',content:[{type:'text',text:'Introduction'}]},
    {type:'callout',attrs:{variant:'soft'},content:[{type:'paragraph',content:[{type:'text',text:'Flexible block'}]}]},
  ]
  about.body.en={type:'doc',content}
  const saved=validateAbout(about as unknown as AboutContent)
  assert.deepEqual(saved.body.en.content.map(node=>node.type),['paragraph','callout'])
})

test('shared enquiry interface defaults are fully localized in the translation seeder',()=>{
  const definitions=getEnquiryInterfaceDefinitions()
  assert.ok(definitions.length>30)
  assert.ok(definitions.every(definition=>definition.page==='enquiry-interface'))
  for(const key of ['fullName','company','workEmail','product','specificationNotes','sendRequest','cancel']) {
    const definition=definitions.find(entry=>entry.key===`enquiry.interface.${key}`)!
    assert.notEqual(definition.translations.ar,definition.translations.en)
    assert.notEqual(definition.translations.fr,definition.translations.en)
  }
})

test('translation seeding stores one owner per source and excludes the replaced contact form',()=>{
  const definitions=getContentTranslationDefinitions()
  assert.equal(definitions.length,new Set(definitions.map(definition=>definition.source)).size)
  assert.equal(definitions.some(definition=>definition.page==='contact'),false)
  assert.equal(definitions.filter(definition=>definition.source==='Request a quote').length,1)
  assert.equal(definitions.filter(definition=>definition.source==='product').length,1)
  assert.equal(definitions.some(definition=>definition.source==='products'),false)
})
