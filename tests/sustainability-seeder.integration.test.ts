import assert from 'node:assert/strict'
import {test} from 'node:test'
import {loadEnvFile} from 'node:process'
import {createConnection} from 'mysql2/promise'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import {configureDB,createConnectionManager,createDialect,resetDB} from '@holo-js/db'
import {configureCacheRuntime,resetCacheRuntime} from '@holo-js/cache'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import Seeder,{getSustainabilitySeedContent} from '../server/db/seeders/SustainabilitySeeder'
const decode=(v:unknown)=>typeof v==='string'?JSON.parse(v):v
test('fresh Sustainability seeding reproduces defaults and never overwrites later edits',async()=>{
 loadEnvFile('.env')
 const client=await createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE})
 const directory=await mkdtemp(join(tmpdir(),'alamir-sustainability-seed-'))
 try{
  for(const table of ['website_settings','sustainability_articles']){
   const [rows]=await client.query(`SHOW CREATE TABLE ${table}`)
   await client.query((rows as Array<{'Create Table':string}>)[0]['Create Table'].replace('CREATE TABLE','CREATE TEMPORARY TABLE'))
  }
  configureDB(createConnectionManager({defaultConnection:'main',connections:{main:{adapter:createMySQLAdapter({client}),dialect:createDialect('mysql'),driver:'mysql'}}}))
  configureCacheRuntime({config:{default:'file',drivers:{file:{driver:'file',path:directory}}}})
  await Seeder.run()
  const [rows]=await client.query('SELECT slug,content,published FROM sustainability_articles ORDER BY id')
  const defaults=getSustainabilitySeedContent()
  assert.deepEqual((rows as {slug:string;content:unknown;published:unknown}[]).map(r=>({...r,content:decode(r.content),published:decode(r.published)})),defaults.articles.map(a=>({...a,published:a.content.locales})))
  const [pages]=await client.query("SELECT value FROM website_settings WHERE setting_key='sustainability'")
  assert.deepEqual(decode((pages as {value:unknown}[])[0].value),defaults.page)
  const edited=structuredClone(defaults.articles[0].content);edited.locales.ar.summary='مقدمة معدلة'
  await client.query('UPDATE sustainability_articles SET content=? WHERE slug=?',[JSON.stringify(edited),defaults.articles[0].slug])
  await Seeder.run()
  const [after]=await client.query('SELECT content FROM sustainability_articles WHERE slug=?',[defaults.articles[0].slug])
  assert.deepEqual(decode((after as {content:unknown}[])[0].content),edited)
 }finally{resetDB();resetCacheRuntime();await client.end();await rm(directory,{recursive:true,force:true})}
})
