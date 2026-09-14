import {extname} from 'node:path'
import type {Readable} from 'node:stream'
import {PDFDocument} from 'pdf-lib'
import {fromBuffer, type Entry, type ZipFile} from 'yauzl'
import {fileTypeFromBuffer} from 'file-type'
import sharp from 'sharp'
import {SaxesParser, type SaxesTagNS} from 'saxes'

const megabyte = 1024 * 1024
export const cvMaxBytes = 10 * megabyte
export type UploadFile = {name?: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer>}

async function readUpload(file: UploadFile, maxBytes: number) {
  if (!Number.isSafeInteger(file.size) || file.size < 1 || file.size > maxBytes) throw new Error('Invalid file size.')
  const bytes = Buffer.from(await file.arrayBuffer())
  if (bytes.length !== file.size || bytes.length > maxBytes) throw new Error('Invalid file size.')
  return bytes
}

async function validatePdf(bytes: Buffer) {
  if (!/^%PDF-(1\.[0-7]|2\.0)/.test(bytes.subarray(0, 8).toString()) || !bytes.subarray(-1024).includes(Buffer.from('%%EOF'))) {
    throw new Error('Choose a valid PDF.')
  }
  const document = await PDFDocument.load(bytes, {throwOnInvalidObject: true, updateMetadata: false})
  if (document.isEncrypted || document.getPageCount() < 1 || document.getPageCount() > 2000) throw new Error('Unsupported PDF.')
}

function validateXml(xml: string, root: string, namespaces: string[], onTag?: (tag: SaxesTagNS) => void) {
  const parser = new SaxesParser({xmlns: true})
  let count = 0
  let depth = 0
  parser.on('doctype', () => {throw new Error('Document types are not allowed in DOCX XML.')})
  parser.on('error', error => {throw error})
  parser.on('opentag', tag => {
    if (++count === 1 && (tag.local !== root || !namespaces.includes(tag.uri))) throw new Error('Invalid DOCX XML root.')
    if (++depth > 100 || count > 100_000) throw new Error('DOCX XML is too complex.')
    onTag?.(tag)
  })
  parser.on('closetag', () => {depth--})
  parser.write(xml).close()
  if (!count) throw new Error('Missing DOCX XML.')
}

async function validateDocx(bytes: Buffer) {
  const zip = await new Promise<ZipFile>((resolve, reject) => {
    fromBuffer(bytes, {lazyEntries: true, validateEntrySizes: true, strictFileNames: true}, (error, archive) => {
      if (error || !archive) reject(error ?? new Error('Invalid DOCX.'))
      else resolve(archive)
    })
  })
  const required = new Map<string, string>()
  const names = new Set<string>()
  let expandedBytes = 0
  try {
    await new Promise<void>((resolve, reject) => {
      zip.on('error', reject)
      zip.on('end', resolve)
      zip.on('entry', (entry: Entry) => {
        void (async () => {
          expandedBytes += entry.uncompressedSize
          if (names.has(entry.fileName) || names.size >= 256 || expandedBytes > 40 * megabyte || entry.isEncrypted()
            || /(?:vbaProject|word\/embeddings\/|\.exe$|\.js$)/i.test(entry.fileName)) throw new Error('Unsupported DOCX contents.')
          names.add(entry.fileName)
          if (entry.fileName.endsWith('/')) {zip.readEntry(); return}
          const stream = await new Promise<Readable>((resolveStream, rejectStream) => {
            zip.openReadStream(entry, (error, readable) => {
              if (error || !readable) rejectStream(error ?? new Error('Invalid ZIP entry.'))
              else resolveStream(readable)
            })
          })
          const capture = ['[Content_Types].xml', 'word/document.xml', '_rels/.rels'].includes(entry.fileName)
          const chunks: Buffer[] = []
          let count = 0
          for await (const chunk of stream) {
            count += chunk.length
            if (count > entry.uncompressedSize || count > 40 * megabyte || (capture && count > 5 * megabyte)) {
              stream.destroy()
              throw new Error('DOCX expands beyond its limit.')
            }
            if (capture) chunks.push(chunk)
          }
          if (capture) required.set(entry.fileName, Buffer.concat(chunks).toString('utf8'))
          zip.readEntry()
        })().catch(reject)
      })
      zip.readEntry()
    })
    const contentTypes = required.get('[Content_Types].xml') ?? ''
    const document = required.get('word/document.xml') ?? ''
    let hasDocumentType = false
    validateXml(contentTypes, 'Types', ['http://schemas.openxmlformats.org/package/2006/content-types'], tag => {
      if (tag.local === 'Override' && tag.attributes.PartName?.value === '/word/document.xml'
        && tag.attributes.ContentType?.value === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml') hasDocumentType = true
    })
    validateXml(document, 'document', ['http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'http://purl.oclc.org/ooxml/wordprocessingml/main'])
    let hasDocumentRelationship = false
    validateXml(required.get('_rels/.rels') ?? '', 'Relationships', ['http://schemas.openxmlformats.org/package/2006/relationships'], tag => {
      if (tag.local === 'Relationship' && /\/officeDocument$/.test(tag.attributes.Type?.value ?? '')
        && ['word/document.xml', '/word/document.xml'].includes(tag.attributes.Target?.value ?? '')
        && tag.attributes.TargetMode?.value !== 'External') hasDocumentRelationship = true
    })
    if (!hasDocumentType || !hasDocumentRelationship || /macroEnabled/i.test(contentTypes)) throw new Error('Choose a valid DOCX document.')
  } finally {
    zip.close()
  }
}

export async function validateCvUpload(file: UploadFile) {
  const extension = extname(file.name ?? '').toLowerCase()
  const mime = extension === '.pdf' ? 'application/pdf'
    : extension === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : null
  if (!mime || (file.type && file.type !== mime && file.type !== 'application/octet-stream')) throw new Error('Choose a PDF or DOCX.')
  const bytes = await readUpload(file, cvMaxBytes)
  if (extension === '.pdf') await validatePdf(bytes)
  else await validateDocx(bytes)
  return {bytes, extension: extension.slice(1)}
}

const cmsTypes: Record<string, {extensions: string[]; max: number}> = {
  'image/jpeg': {extensions: ['.jpg', '.jpeg'], max: 20 * megabyte},
  'image/png': {extensions: ['.png'], max: 20 * megabyte},
  'image/webp': {extensions: ['.webp'], max: 20 * megabyte},
  'image/avif': {extensions: ['.avif'], max: 20 * megabyte},
  'image/x-icon': {extensions: ['.ico'], max: 10 * megabyte},
  'application/pdf': {extensions: ['.pdf'], max: 10 * megabyte},
  'video/mp4': {extensions: ['.mp4'], max: 100 * megabyte},
  'video/webm': {extensions: ['.webm'], max: 100 * megabyte},
}

export async function validateCmsUpload(file: UploadFile) {
  const mime = file.type === 'image/vnd.microsoft.icon' ? 'image/x-icon' : file.type
  const rule = cmsTypes[mime]
  if (!rule || !rule.extensions.includes(extname(file.name ?? '').toLowerCase())) throw new Error('The file extension and type must match an allowed image, PDF, or video.')
  const bytes = await readUpload(file, rule.max)
  const detected = await fileTypeFromBuffer(bytes)
  if (detected?.mime !== mime) throw new Error('The file contents do not match its type.')
  if (mime === 'application/pdf') await validatePdf(bytes)
  else if (mime.startsWith('image/') && mime !== 'image/x-icon') {
    const metadata = await sharp(bytes, {limitInputPixels: 40_000_000, failOn: 'warning'}).metadata()
    if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) throw new Error('Choose a still image within the image limits.')
  }
}
