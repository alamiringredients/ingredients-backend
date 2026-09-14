import {test} from 'node:test'
import assert from 'node:assert/strict'
import {loadEnvFile} from 'node:process'
import {randomUUID} from 'node:crypto'
import {createConnection} from 'mysql2/promise'
import {configureDB,createConnectionManager,createDialect,resetDB} from '@holo-js/db'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import {configureStorageRuntime,resetStorageRuntime,type StorageBackend} from '@holo-js/storage/runtime'
import {submitApplication} from '../server/services/careers/submissions'
import {isValidationException} from '@holo-js/forms'
import CareerJob from '../server/models/CareerJob'
test('Shared application submission stores private CVs, deduplicates retries and rejects closed jobs and invalid files',async()=>{
 loadEnvFile('.env')
 const c=await createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE})
 const files=new Map<string,unknown>()
 const backend={getItem:async(k:string)=>files.get(k)??null,getItemRaw:async(k:string)=>files.get(k)??null,setItem:async(k:string,v:unknown)=>{files.set(k,v)},setItemRaw:async(k:string,v:unknown)=>{files.set(k,v)},hasItem:async(k:string)=>files.has(k),removeItem:async(k:string)=>{files.delete(k)},getKeys:async()=>[...files.keys()]} as StorageBackend
 try{
  for(const t of ['career_jobs','career_applications']){const [rows]=await c.query(`SHOW CREATE TABLE ${t}`);const ddl=(rows as {'Create Table':string}[])[0]['Create Table'].split('\n').filter(line=>!line.includes('CONSTRAINT')).join('\n').replace(/,\n\)/,'\n)').replace('CREATE TABLE','CREATE TEMPORARY TABLE');await c.query(ddl)}
  configureDB(createConnectionManager({defaultConnection:'main',connections:{main:{adapter:createMySQLAdapter({client:c}),dialect:createDialect('mysql'),driver:'mysql'}}}))
  configureStorageRuntime({getRuntimeConfig:()=>({holoStorage:{defaultDisk:'applications',diskNames:['applications'],routePrefix:'/storage',disks:{applications:{name:'applications',driver:'local',visibility:'private',root:'/private-test'}}}}),getStorage:()=>backend})
  const job=await CareerJob.create({slug:'test-job',code:'TEST',status:'open',content:{en:{title:'Test job'},ar:{title:'وظيفة اختبار'},fr:{title:'Emploi de test'}}})
  const form=()=>({name:'Test Applicant',email:'applicant@example.test',phone:'12345678',department:'',letter:'',consent:true as const,locale:'en' as const,key:randomUUID(),cv:new File(['%PDF-1.4\nTest CV\n%%EOF'],'cv.pdf',{type:'application/pdf'}),website:undefined,jobId:undefined})
  const general=form();assert.deepEqual(await submitApplication(general),{locale:'en'});assert.deepEqual(await submitApplication(general),{locale:'en'})
  const specific={...form(),jobId:Number(job.id)};assert.deepEqual(await submitApplication(specific),{locale:'en'})
  const [rows]=await c.query('SELECT job_id,status,cv_path FROM career_applications');assert.equal((rows as unknown[]).length,2);assert.equal(files.size,2);assert.equal((rows as {job_id:unknown}[])[0].job_id,null)
  await job.update({status:'closed'});const closed={...form(),jobId:Number(job.id)};await assert.rejects(()=>submitApplication(closed),isValidationException)
  const invalid={...form(),cv:new File(['not PDF'],'bad.pdf')};await assert.rejects(()=>submitApplication(invalid),isValidationException)
 }finally{resetStorageRuntime();resetDB();await c.end()}
})
