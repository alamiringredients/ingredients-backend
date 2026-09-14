import assert from 'node:assert/strict'
import {test} from 'node:test'
import {certificationEntries,downloadableCertifications,effectiveStatus} from '../lib/certifications/contracts'
import {validateCertification,validateCertificationType} from '../lib/certifications/validation'
import {getCertificationSeedContent} from '../server/db/seed-data/certification-seed-content'
import {getQualityPageSeedContent} from '../server/db/seeders/QualityPageSeeder'

test('seed content shares types while preserving holder-specific status, scope and dates',()=>{
  const data=getCertificationSeedContent()
  assert.equal(data.types.length,14)
  assert.equal(data.certifications.length,18)
  assert.equal(certificationEntries(data,'group').length,9)
  assert.equal(certificationEntries(data,'sadat-city').length,9)
  const iso=data.types.find(type=>type.slug==='iso-14001')!
  const records=data.certifications.filter(record=>record.type_id===iso.id)
  assert.deepEqual(records.map(record=>record.status),['held','planned'])
  assert.equal(records[1].content.target_date,'2026-12-10')
  assert.equal(downloadableCertifications(data).length,0)
  assert.equal(new Set(data.types.map(type=>type.slug)).size,data.types.length)
})

test('publication, holder and current status control public document availability',()=>{
  const data=getCertificationSeedContent()
  data.certifications.forEach(record=>{record.content.document='/test.pdf'})
  const record=data.certifications[0]
  assert.equal(downloadableCertifications(data).length,9)
  record.published=false
  assert.equal(downloadableCertifications(data).length,8)
  record.published=true
  record.content.expiry_date='2026-09-06'
  assert.equal(effectiveStatus(record,'2026-09-06'),'held')
  assert.equal(effectiveStatus(record,'2026-09-07'),'expired')
  assert.equal(downloadableCertifications(data,'group','2026-09-07').length,8)
  record.status='suspended'
  assert.equal(effectiveStatus(record,'2026-09-07'),'suspended')
  assert.equal(downloadableCertifications(data,'sadat-city').length,0)
})

test('record validation rejects invalid dates, unsafe files and incomplete types',()=>{
  const data=getCertificationSeedContent(),valid=data.certifications[0]
  assert.doesNotThrow(()=>validateCertification(valid))
  assert.throws(()=>validateCertification({...valid,content:{...valid.content,target_date:'2026-02-30'}}),/valid target date/)
  assert.throws(()=>validateCertification({...valid,content:{...valid.content,issue_date:'2027-01-01',expiry_date:'2026-01-01'}}),/Expiry date/)
  for(const document of ['javascript:alert(1)','//evil.test/file.pdf','mailto:person@example.test','/\\evil.test/file.pdf'])assert.throws(()=>validateCertification({...valid,content:{...valid.content,document}}))
  assert.throws(()=>validateCertificationType({...data.types[0],content:{...data.types[0].content,logo:'',badge:''}}),/logo or a text badge/)
})

test('page copy stays out of the certification translation catalog',async()=>{
  const {getTranslationDefinitions}=await import('../lib/translation-catalog')
  const {getCertificationTranslationDefinitions}=await import('../server/db/seed-data/certification-translation-definitions')
  const entries=[...getTranslationDefinitions(),...getCertificationTranslationDefinitions()]
  for(const text of ['HACCP','ISO 14001','Nine certifications','Download all certificates'])assert.ok(!entries.some(entry=>entry.page==='quality'&&entry.source===text),text)
  for(const text of ['Target','Planned','Download certificate','PDF'])assert.ok(entries.some(entry=>entry.page==='certification-interface'&&entry.source===text),text)
})

test('quality seed retains every section and its media',()=>{
  const content=getQualityPageSeedContent()
  assert.equal(content.hero.image,'/assets/photos/qc-lab.webp')
  const blocks=content.body.en.content.flatMap(section=>section.content??[])
  assert.equal((blocks.find(block=>block.type==='mediaCards')?.attrs?.items as unknown[]).length,3)
  assert.match(String(blocks.find(block=>block.type==='video')?.attrs?.src),/youtube-nocookie\.com\/embed/)
})

test('download sizes use bytes and omit unknown sizes',async()=>{
  const {formatFileSize}=await import('../lib/downloads/format-size')
  assert.equal(formatFileSize(0),'0 B')
  assert.equal(formatFileSize(1024),'1 KB')
  assert.equal(formatFileSize(1536),'1.5 KB')
  assert.equal(formatFileSize(2621440),'2.5 MB')
  assert.equal(formatFileSize(undefined),null)
  assert.equal(formatFileSize(-1),null)
})
