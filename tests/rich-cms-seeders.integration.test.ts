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
import HomePageSeeder from '../server/db/seeders/HomePageSeeder'
import QualityPageSeeder from '../server/db/seeders/QualityPageSeeder'
import DownloadsPageSeeder from '../server/db/seeders/DownloadsPageSeeder'
import ProductCatalogSeeder from '../server/db/seeders/ProductCatalogSeeder'
import snapshot from '../server/db/seed-data/managed-content-snapshot.json'

// Temporary tables shadow production tables only for this connection.
test('fresh page seeders reproduce the saved editorial snapshot and retain subsequent edits',async()=>{
  loadEnvFile('.env')
  const client=await createConnection({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USERNAME||'root',password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE||'alamir'})
  const directory=await mkdtemp(join(tmpdir(),'alamir-rich-seed-'))
  const decode=(v:unknown)=>typeof v==='string'?JSON.parse(v):v
  try{
    for(const table of ['home_sections','website_settings','products','product_categories','media']){
      const [rows]=await client.query(`SHOW CREATE TABLE \`${table}\``)
      const ddl=(rows as Array<{'Create Table':string}>)[0]['Create Table'].replace('CREATE TABLE','CREATE TEMPORARY TABLE').split('\n').filter(line=>!line.trimStart().startsWith('CONSTRAINT ')).join('\n').replace(/,\n\)/,'\n)')
      await client.query(ddl)
    }
    configureDB(createConnectionManager({defaultConnection:'main',connections:{main:{adapter:createMySQLAdapter({client}),dialect:createDialect('mysql'),driver:'mysql'}}}))
    configureCacheRuntime({config:{default:'file',drivers:{file:{driver:'file',path:directory}}}})
    const seed=async()=>{await HomePageSeeder.run();await QualityPageSeeder.run();await DownloadsPageSeeder.run();await ProductCatalogSeeder.run()}
    await seed()
    const [homes]=await client.query('SELECT content FROM home_sections ORDER BY sort_order,id')
    assert.deepEqual((homes as {content:unknown}[]).map(r=>decode(r.content)),snapshot.home.sections)
    const [settings]=await client.query('SELECT setting_key,value FROM website_settings')
    const values=Object.fromEntries((settings as {setting_key:string;value:unknown}[]).map(r=>[r.setting_key,decode(r.value)]))
    assert.deepEqual(values.home_seo,snapshot.home.seo)
    assert.deepEqual(values.quality,snapshot.quality)
    assert.deepEqual(values.downloads,snapshot.downloads)
    assert.deepEqual(values.catalog,snapshot.catalog.settings)
    for(const [table,records] of [['product_categories',snapshot.catalog.categories],['products',snapshot.catalog.products]] as const){
      const [rows]=await client.query(`SELECT slug,published,sort_order,content FROM ${table} ORDER BY sort_order,id`)
      assert.deepEqual((rows as {slug:string;published:number;sort_order:number;content:unknown}[]).map(r=>({...r,published:Boolean(r.published),content:decode(r.content)})),records.map(({slug,published,sort_order,content})=>({slug,published,sort_order,content})))
    }
    const hero=structuredClone(snapshot.home.sections.find(s=>s.key==='hero')!)
    hero.richTexts![0].values.en={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'A shorter edited heading'}]}]}
    await client.query("UPDATE home_sections SET content = ? WHERE section_key = 'hero'",[JSON.stringify(hero)])
    await seed()
    const [edited]=await client.query("SELECT content FROM home_sections WHERE section_key='hero'")
    assert.deepEqual(decode((edited as {content:unknown}[])[0].content),hero)
  }finally{resetDB();resetCacheRuntime();await client.end();await rm(directory,{recursive:true,force:true})}
})
