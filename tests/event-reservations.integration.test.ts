import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {loadEnvFile} from 'node:process'
import {test} from 'node:test'
import {configureCacheRuntime,resetCacheRuntime} from '@holo-js/cache'
import {configureDB,createConnectionManager,createDialect,resetDB} from '@holo-js/db'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import {createConnection} from 'mysql2/promise'
import {localizedDocuments} from '../lib/events/content'
import {reserveEventSlot,type MeetingReservationInput} from '../server/services/events/reservations'
import type {EventContent} from '../lib/events/contracts'
import Event from '../server/models/Event'
import EventSlot from '../server/models/EventSlot'

const localized=(value:string)=>({en:value,ar:value,fr:value})
const content:EventContent={
  title:localizedDocuments(localized('Test event'),true),
  eyebrow:localized('Event'),
  summary:localized('Summary'),
  location:localized('Cairo'),
  venue:localized('Cairo'),
  stand:localized(''),
  body:localizedDocuments(localized('Body')),
  heroImage:'/test.webp',
  heroAlt:localized('Test'),
  heroCaption:localized(''),
  seo:{title:localized('Test'),description:localized('Test'),socialTitle:localized('Test'),socialDescription:localized('Test'),socialImage:''},
}

test('the slot lock and conditional write allow exactly one reservation',async()=>{
  loadEnvFile('.env')
  const client=await createConnection({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USERNAME||'root',password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE||'alamir'})
  const directory=await mkdtemp(join(tmpdir(),'alamir-reservation-lock-'))
  try{
    for(const table of ['events','event_slots']){
      const [rows]=await client.query(`SHOW CREATE TABLE \`${table}\``)
      const ddl=(rows as Array<{'Create Table':string}>)[0]['Create Table'].replace('CREATE TABLE','CREATE TEMPORARY TABLE').split('\n').filter(line=>!line.trimStart().startsWith('CONSTRAINT ')).join('\n').replace(/,\n\)/,'\n)')
      await client.query(ddl)
    }
    configureDB(createConnectionManager({defaultConnection:'main',connections:{main:{adapter:createMySQLAdapter({client}),dialect:createDialect('mysql'),driver:'mysql'}}}))
    configureCacheRuntime({config:{default:'file',drivers:{file:{driver:'file',path:directory}}}})
    const start=new Date(Date.now()+86_400_000)
    const event=await Event.create({slug:'lock-test',kind:'event',published:true,sort_order:0,starts_at:start,ends_at:new Date(start.getTime()+86_400_000),timezone:'UTC',content})
    const slot=await EventSlot.create({event_id:Number(event.id),starts_at:start,ends_at:new Date(start.getTime()+1_800_000),status:'available',reservation_name:'',reservation_company:'',reservation_email:'',reservation_country:'',reservation_dial_code:'',reservation_phone:'',reservation_topic:'',reservation_message:'',reservation_locale:'en',mail_status:''})
    const base={slotId:Number(slot.id),eventId:Number(event.id),company:'Company',country:'Egypt',dialCode:'+20',phone:'1000000000',topic:'Products',message:'',locale:'en'}
    const attempts:MeetingReservationInput[]=[{...base,name:'First',email:'first@example.test',key:randomUUID()},{...base,name:'Second',email:'second@example.test',key:randomUUID()}]
    const results=await Promise.allSettled(attempts.map(reserveEventSlot))
    assert.equal(results.filter(result=>result.status==='fulfilled').length,1)
    assert.equal(results.filter(result=>result.status==='rejected').length,1)
    const winner=results.findIndex(result=>result.status==='fulfilled')
    const saved=await EventSlot.findOrFail(Number(slot.id))
    assert.equal(saved.status,'reserved')
    assert.equal(saved.reservation_name,attempts[winner].name)
    const retry=await reserveEventSlot(attempts[winner])
    assert.equal(retry.slotId,Number(slot.id))
  }finally{
    resetCacheRuntime()
    resetDB()
    await client.end()
    await rm(directory,{recursive:true,force:true})
  }
})
