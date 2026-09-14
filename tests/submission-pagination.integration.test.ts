import {test} from 'node:test'
import assert from 'node:assert/strict'
import {loadEnvFile} from 'node:process'
import {createConnection} from 'mysql2/promise'
import {configureDB,createConnectionManager,createDialect,resetDB} from '@holo-js/db'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import {getSubmissionList} from '../server/admin/submission-list'

test('submission pagination filters the whole collection and excludes detail fields',async()=>{
  loadEnvFile('.env')
  const client=await createConnection({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USERNAME||'root',password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE||'alamir'})
  try{
    await client.query('CREATE TEMPORARY TABLE career_applications (id INT PRIMARY KEY,name TEXT,email TEXT,job_title TEXT,department TEXT,status VARCHAR(30),created_at DATETIME,letter TEXT)')
    await client.query('CREATE TEMPORARY TABLE contact_enquiries (id INT PRIMARY KEY,name TEXT,email TEXT,company TEXT,product TEXT,source VARCHAR(30),status VARCHAR(30),created_at DATETIME,message TEXT)')
    for(let id=1;id<=60;id++){
      await client.query("INSERT INTO career_applications VALUES (?,?,?,?,?,?,'2026-09-09','private long letter')",[id,`Person ${id}`,`person${id}@example.test`,'Engineer','Production',id%2?'pending':'accepted'])
      await client.query("INSERT INTO contact_enquiries VALUES (?,?,?,?,?,?,?,'2026-09-09','private message')",[id,`Contact ${id}`,`contact${id}@example.test`,id===1?'100% Foods':'Company','Tomato',id%2?'quote':'contact',id%2?'open':'closed'])
    }
    configureDB(createConnectionManager({defaultConnection:'main',connections:{main:{adapter:createMySQLAdapter({client}),dialect:createDialect('mysql'),driver:'mysql'}}}))
    const first=await getSubmissionList('applications',{})
    const second=await getSubmissionList('applications',{page:'2'})
    assert.equal(first.records.length,25)
    assert.equal(first.pagination.meta.total,60)
    assert.equal(first.records[0].id,60)
    assert.equal(second.records[0].id,35)
    assert.ok(!first.records.some((row:{id:number})=>second.records.some((other:{id:number})=>row.id===other.id)))
    assert.ok(first.records.every((row:Record<string,unknown>)=>!('letter' in row)))
    const filtered=await getSubmissionList('applications',{status:'pending',page:'2'})
    assert.equal(filtered.pagination.meta.total,30)
    assert.equal(filtered.records.length,5)
    assert.deepEqual(filtered.counts,{pending:30,accepted:30,declined:0})
    const search=await getSubmissionList('applications',{q:'person1@example.test'})
    assert.equal(search.records[0].id,1)
    assert.equal(search.pagination.meta.total,1)
    const last=await getSubmissionList('applications',{page:'999'})
    assert.equal(last.pagination.meta.currentPage,3)
    const literal=await getSubmissionList('enquiries',{q:'100%',source:'quote',status:'open'})
    assert.equal(literal.records.length,1)
    assert.equal(literal.records[0].id,1)
    assert.ok(!('message' in literal.records[0]))
    assert.equal((await getSubmissionList('applications',{page:'-1',status:'invalid'})).pagination.meta.currentPage,1)
  }finally{resetDB();await client.end()}
})
