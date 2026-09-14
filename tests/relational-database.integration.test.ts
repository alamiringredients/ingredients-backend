import assert from 'node:assert/strict'
import {test} from 'node:test'
import {loadEnvFile} from 'node:process'
import {randomUUID} from 'node:crypto'
import {createPool} from 'mysql2/promise'
import {configureCacheRuntime, resetCacheRuntime} from '@holo-js/cache'
import {configureDB, createConnectionManager, createDialect, DB, resetDB} from '@holo-js/db'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import {getNewsRecords} from '../server/services/news/records'
import {persistNews} from './support/persist-news'
import {persistSustainability} from './support/persist-sustainability'
import {getSustainabilityRecords} from '../server/services/sustainability/records'
import {reserveEventSlot} from '../server/services/events/reservations'
import {getCatalog} from '../server/services/catalog/content'
import Product from '../server/models/Product'
import ProductApplication from '../server/models/ProductApplication'
import ProductTranslation from '../server/models/ProductTranslation'
import ConcentrationRange from '../server/models/ConcentrationRange'
import NewsArticle from '../server/models/NewsArticle'
import NewsPublication from '../server/models/NewsPublication'
import SustainabilityArticle from '../server/models/SustainabilityArticle'
import SustainabilityPublication from '../server/models/SustainabilityPublication'
import '../server/models/ProductCategory'
import '../server/models/ProductTranslation'
import '../server/models/ProductApplication'
import '../server/models/ConcentrationRange'
import '../server/models/EventReservation'
import {cmsLocales} from '../lib/cms/contracts'
import {localizeContent} from '../lib/catalog/localized-content'

loadEnvFile('.env')
const pool=createPool({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USERNAME||'root',password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE,connectionLimit:6})

async function publishedNews(locale:string,slug:string){
  const article=await NewsArticle.where('slug',slug).firstJson()
  if(!article)return null
  const publication=await NewsPublication.where('article_id',article.id).where('locale',locale).firstJson()
  if(!publication)return null
  return {content:typeof publication.metadata==='string'?JSON.parse(publication.metadata):publication.metadata,published:typeof publication.content==='string'?JSON.parse(publication.content):publication.content}
}

async function publishedSustainability(locale:string,slug:string){
  const article=await SustainabilityArticle.where('slug',slug).firstJson()
  if(!article)return null
  const publication=await SustainabilityPublication.where('article_id',article.id).where('locale',locale).firstJson()
  if(!publication)return null
  return {content:typeof publication.metadata==='string'?JSON.parse(publication.metadata):publication.metadata,published:typeof publication.content==='string'?JSON.parse(publication.content):publication.content}
}

test('relational writes preserve publication boundaries and enforce catalog and booking integrity', async t=>{
  assert.equal(process.env.DB_DATABASE,'alamir_relational','Integration writes require the isolated rebuild database.')
  configureCacheRuntime({config:{default:'memory',drivers:{memory:{driver:'memory'}}}})
  configureDB(createConnectionManager({defaultConnection:'main',connections:{main:{adapter:createMySQLAdapter({client:pool}),dialect:createDialect('mysql'),driver:'mysql'}}}))
  const newsSlug=`test-news-${randomUUID()}`, sustainabilitySlug=`test-sustainability-${randomUUID()}`
  let newsId=0,sustainabilityId=0,eventId=0
  try {
    await t.test('eager-loads product relations and rejects duplicate and orphan assignments',async()=>{
      const product=await Product.with('category','translations','applications','concentrations').firstOrFail()
      assert.ok(product.getRelation('category'))
      assert.equal((product.getRelation('translations') as unknown[]).length,3)
      const [assignments]=await pool.query('SELECT product_id,application_id FROM application_product LIMIT 1')
      const pair=(assignments as {product_id:number;application_id:number}[])[0]
      await assert.rejects(pool.query('INSERT INTO application_product (product_id,application_id) VALUES (?,?)',[pair.product_id,pair.application_id]))
      await assert.rejects(pool.query('INSERT INTO application_product (product_id,application_id) VALUES (?,?)',[pair.product_id,999999999]))
    })
    await t.test('saving a multilingual product round-trips its editor content and assignments',async()=>{
      const before=await getCatalog(true)
      const product=before.products[0]
      await DB.transaction(async()=>{
        const record=await Product.findOrFail(product.id)
        for(const [relation,Model,slugs] of [['applications',ProductApplication,product.content.applications],['concentrations',ConcentrationRange,product.content.concentrations]] as const){
          const options=await Model.whereIn('slug',slugs).get()
          const ids=slugs.map(slug=>Number(options.find(option=>option.slug===slug)!.id))
          await record[relation]().sync(ids)
          for(const [sortOrder,optionId] of ids.entries())await record[relation]().updateExistingPivot(optionId,{sort_order:sortOrder})
        }
        const {name,description,seo}=product.content
        const content=Object.fromEntries(Object.entries(product.content).filter(([key])=>!['name','description','seo','seedKey','applications','concentrations'].includes(key)))
        for(const locale of cmsLocales)await ProductTranslation.upsert({product_id:product.id,locale},{name:name[locale],description:description[locale],seo_title:seo.title[locale],seo_description:seo.description[locale],content:localizeContent(content,locale)})
      })
      const after=await getCatalog(true)
      assert.deepEqual(after.products.find(row=>row.id===product.id),product)
    })
    await t.test('news drafts cannot change published metadata and stale saves are rejected',async()=>{
      const template=(await getNewsRecords())[0]
      const content=structuredClone(template.content)
      content.relatedSlugs=[];content.previousSlug='';content.nextSlug=''
      const published=await persistNews({id:0,revision:0,slug:newsSlug,content,operation:'publish',locale:'en'})
      newsId=published.id
      const before=await publishedNews('en',newsSlug)
      content.date='2030-01-01';content.featured=!content.featured
      content.locales.en.summary='Unpublished draft'
      await persistNews({id:newsId,revision:published.revision,slug:newsSlug,content,operation:'save',locale:'en'})
      assert.deepEqual(await publishedNews('en',newsSlug),before)
      await assert.rejects(persistNews({id:newsId,revision:published.revision,slug:newsSlug,content,operation:'save',locale:'en'}),/another session/)
      const latest=(await getNewsRecords(newsId))[0]
      await persistNews({id:newsId,revision:latest.revision,slug:newsSlug,content,operation:'publish',locale:'ar'})
      assert.equal((await publishedNews('ar',newsSlug))?.content.date,'2030-01-01')
      assert.equal((await publishedNews('en',newsSlug))?.content.date,before?.content.date)
    })
    await t.test('sustainability drafts cannot change published ordering',async()=>{
      const content=structuredClone((await getSustainabilityRecords())[0].content)
      const published=await persistSustainability({id:0,revision:0,slug:sustainabilitySlug,content,operation:'publish',locale:'en'})
      sustainabilityId=published.id
      const before=await publishedSustainability('en',sustainabilitySlug)
      content.sortOrder+=100;content.featured=!content.featured
      await persistSustainability({id:sustainabilityId,revision:published.revision,slug:sustainabilitySlug,content,operation:'save',locale:'en'})
      assert.deepEqual(await publishedSustainability('en',sustainabilitySlug),before)
    })
    await t.test('concurrent bookings allow one winner and idempotent retries do not send again',async()=>{
      const [events]=await pool.query('SELECT content FROM events LIMIT 1')
      const content=(events as {content:unknown}[])[0].content
      const starts=new Date(Date.now()+86400000),ends=new Date(+starts+3600000)
      eventId=Number(await DB.table('events').insertGetId({slug:`test-booking-${randomUUID()}`,kind:'event',published:true,sort_order:0,starts_at:starts,ends_at:ends,timezone:'UTC',content:JSON.stringify(content)}))
      const slotId=Number(await DB.table('event_slots').insertGetId({event_id:eventId,starts_at:starts,ends_at:ends,status:'available'}))
      const base={slotId,eventId,company:'Test',country:'Egypt',dialCode:'+20',phone:'1000000000',topic:'Products',locale:'en'}
      const attempts=[{...base,name:'First',email:'first@example.test',key:randomUUID()},{...base,name:'Second',email:'second@example.test',key:randomUUID()}]
      const results=await Promise.allSettled(attempts.map(reserveEventSlot))
      assert.equal(results.filter(result=>result.status==='fulfilled').length,1)
      const winner=results.findIndex(result=>result.status==='fulfilled')
      const retry=await reserveEventSlot(attempts[winner])
      assert.equal(retry.created,false)
      assert.equal(await DB.table('event_reservations').where('slot_id',slotId).count(),1)
      await assert.rejects(DB.table('event_slots').where('id',slotId).delete())
    })
  } finally {
    if(newsId)await pool.query('DELETE FROM news_articles WHERE id=?',[newsId])
    if(sustainabilityId)await pool.query('DELETE FROM sustainability_articles WHERE id=?',[sustainabilityId])
    if(eventId){await pool.query('DELETE r FROM event_reservations r JOIN event_slots s ON s.id=r.slot_id WHERE s.event_id=?',[eventId]);await pool.query('DELETE FROM events WHERE id=?',[eventId])}
    resetCacheRuntime();resetDB();await pool.end()
  }
})
