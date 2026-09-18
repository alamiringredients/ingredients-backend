import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {test} from 'node:test'
import {PDFDocument} from 'pdf-lib'
import {zipSync, strToU8} from 'fflate'
import sharp from 'sharp'
import {validateCvUpload, validateCmsUpload, cvMaxBytes} from '../server/security/uploads'
import {limitRequestBody} from '../server/http/request-body'
import {publicFormRoute} from '../server/http/public-form'
import {ValidationException} from '@holo-js/forms'

function file(bytes: Uint8Array, name: string, type: string) {
  return new File([new Uint8Array(bytes)], name, {type})
}

function docx(extra: Record<string, Uint8Array> = {}) {
  return zipSync({
    '[Content_Types].xml': strToU8('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
    '_rels/.rels': strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
    'word/document.xml': strToU8('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p/></w:body></w:document>'),
    ...extra,
  })
}

test('accepts a real PDF and DOCX CV', async () => {
  const pdf = await PDFDocument.create()
  pdf.addPage()
  assert.equal((await validateCvUpload(file(await pdf.save(), 'resume.PDF', 'application/pdf'))).extension, 'pdf')
  assert.equal((await validateCvUpload(file(docx(), 'resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))).extension, 'docx')
})

test('rejects empty or oversized CVs before reading the file', async () => {
  for (const size of [0, cvMaxBytes + 1]) {
    let read = false
    await assert.rejects(validateCvUpload({name: 'resume.pdf', type: 'application/pdf', size, async arrayBuffer() {read = true; return new ArrayBuffer(0)}}), /size/)
    assert.equal(read, false)
  }
})

test('rejects spoofed extensions, MIME types, truncated PDFs and fake DOCX signatures', async () => {
  const inputs = [
    file(strToU8('<script>alert(1)</script>'), 'resume.pdf', 'application/pdf'),
    file(strToU8('%PDF-1.7\nnot a document\n%%EOF'), 'resume.pdf', 'application/pdf'),
    file(strToU8('%PDF-1.7'), 'resume.pdf', 'text/html'),
    file(strToU8('PK [Content_Types].xml word/'), 'resume.docx', 'application/octet-stream'),
    file(docx(), 'resume.exe', 'application/octet-stream'),
    file(zipSync({'[Content_Types].xml': strToU8('not Word'), 'word/document.xml': strToU8('not XML')}), 'resume.docx', ''),
  ]
  for (const input of inputs) await assert.rejects(validateCvUpload(input))
})

test('rejects DOCX macros, embedded executables, excessive entries and decompression bombs', async () => {
  const tooMany = Object.fromEntries(Array.from({length: 257}, (_, i) => [`word/${i}.xml`, strToU8('x')]))
  for (const extra of [
    {'word/vbaProject.bin': strToU8('macro')},
    {'word/embeddings/file.exe': strToU8('MZ')},
    {'word/document.xml': strToU8('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><unclosed>')},
    {'word/document.xml': strToU8('<!DOCTYPE document [<!ENTITY leak SYSTEM "file:///etc/passwd">]><document xmlns="http://schemas.openxmlformats.org/wordprocessingml/2006/main">&leak;</document>')},
    tooMany,
    {'word/large.bin': new Uint8Array(41 * 1024 * 1024)},
  ]) await assert.rejects(validateCvUpload(file(docx(extra), 'resume.docx', 'application/octet-stream')))
})

test('public routes return Holo error codes and never expose internal exceptions', async () => {
  const request = new Request('http://localhost/apply')
  const invalid = await publicFormRoute(async () => {throw new ValidationException({cv: ['file']})})(request)
  assert.equal(invalid.status, 422)
  assert.deepEqual((await invalid.json()).errors, {cv: ['file']})
  const failed = await publicFormRoute(async () => {throw new Error('Private database connection details')})(request)
  assert.equal(failed.status, 500)
  assert.deepEqual(await failed.json(), {ok: false, valid: false, status: 500, values: {}, errors: {_root: ['failed']}})
})

test('caps a chunked request even without a Content-Length header', async () => {
  let cancelled = false
  const stream = new ReadableStream({start(controller) {controller.enqueue(new Uint8Array(8)); controller.enqueue(new Uint8Array(8))}, cancel() {cancelled = true}})
  const request = new Request('http://localhost/apply', {method: 'POST', body: stream, duplex: 'half'} as RequestInit)
  assert.equal(await limitRequestBody(request, 10), null)
  assert.equal(cancelled, true)
  const declared = new Request('http://localhost/apply', {method: 'POST', headers: {'content-length': '20'}, body: 'small'})
  assert.equal(await limitRequestBody(declared, 10), null)
  const valid = await limitRequestBody(new Request('http://localhost/apply', {method: 'POST', body: 'valid'}), 10)
  assert.equal(await valid?.text(), 'valid')
})

test('CMS validates bytes, filename, MIME and per-type size', async () => {
  const png = await sharp({create: {width: 4, height: 4, channels: 3, background: '#ff0000'}}).png().toBuffer()
  await validateCmsUpload(file(png, 'image.png', 'image/png'))
  await assert.rejects(validateCmsUpload(file(png, 'image.jpg', 'image/jpeg')), /contents/)
  await assert.rejects(validateCmsUpload(file(strToU8('<svg onload="alert(1)"/>'), 'image.svg', 'image/svg+xml')))
  await assert.rejects(validateCmsUpload({name: 'image.png', type: 'image/png', size: 21 * 1024 * 1024, arrayBuffer: async () => {throw Error('must not read')}}), /size/)
})

test('CMS accepts WebM videos and rejects direct MP4 uploads', async () => {
  const webm = await readFile(new URL('../public/assets/videos/hero.webm', import.meta.url))
  await validateCmsUpload(file(webm, 'hero.webm', 'video/webm'))
  await assert.rejects(validateCmsUpload(file(webm, 'hero.mp4', 'video/mp4')), /allowed/)
  await assert.rejects(validateCmsUpload(file(webm, 'hero.mp4', 'video/webm')), /allowed/)
})

test('the Holo-resolved Sharp converts AVIF, gallery and artwork using patched binaries', async () => {
  const {createRequire} = await import('node:module')
  const requireMedia = createRequire(import.meta.resolve('@holo-js/media'))
  const mediaSharp = requireMedia('sharp') as typeof sharp
  assert.equal(mediaSharp.versions.sharp, '0.35.4')
  const avif = await mediaSharp({create: {width: 600, height: 400, channels: 3, background: '#00ff00'}}).avif().toBuffer()
  await validateCmsUpload(file(avif, 'image.avif', 'image/avif'))
  for (const [width, height] of [[1920, 1920], [1600, 1200], [300, 300]]) {
    const image = await mediaSharp(avif).resize(width, height, {fit: 'inside'}).webp().toBuffer()
    const dimensions = await mediaSharp(image).metadata()
    assert.ok(dimensions.width <= width && dimensions.height <= height)
    assert.equal(dimensions.format, 'webp')
  }
})
