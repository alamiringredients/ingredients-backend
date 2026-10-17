import {localizedValue, safeUrl} from '@/lib/catalog/validation'
import {certificationHolders, certificationKinds, certificationStatuses, type Certification, type CertificationType} from './contracts'

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid certification content.')
  return value as Record<string, unknown>
}
function text(value: unknown, label: string, max = 250) {
  if (typeof value !== 'string' || value.length > max) throw new Error(`${label} must be ${max} characters or fewer.`)
  return value.trim()
}
function date(value: unknown, label: string) {
  const result = text(value, label, 10)
  if (result && (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(Date.parse(result)) || new Date(result).toISOString().slice(0, 10) !== result)) throw new Error(`Enter a valid ${label.toLowerCase()}.`)
  return result
}
function assetUrl(value: unknown) {
  const result = safeUrl(value)
  if (result && !/^(?:\/(?!\/)|https?:\/\/)/i.test(result)) throw new Error('Use a website path or an HTTP or HTTPS URL for files.')
  return result
}
export function validateCertificationType(value: unknown): Omit<CertificationType, 'id'> {
  const input = object(value), content = object(input.content)
  const slug = text(input.slug, 'Slug', 150)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Use lowercase letters, numbers and single hyphens for the slug.')
  const kind = content.kind as CertificationType['content']['kind']
  if (!certificationKinds.includes(kind)) throw new Error('Choose a valid credential kind.')
  const logo = assetUrl(content.logo), badge = text(content.badge, 'Text badge', 30)
  if (!logo && !badge) throw new Error('Add a logo or a text badge.')
  return {slug, content: {name: localizedValue(content.name, 'Name', true), description: localizedValue(content.description, 'Description'), kind, logo, badge}}
}
export function validateCertification(value: unknown): Omit<Certification, 'id'> {
  const input = object(value), content = object(input.content)
  const holder = input.holder as Certification['holder'], status = input.status as Certification['status']
  if (!certificationHolders.includes(holder)) throw new Error('Choose a valid holder.')
  if (!certificationStatuses.includes(status)) throw new Error('Choose a valid status.')
  if (!Number.isSafeInteger(input.type_id) || Number(input.type_id) < 1) throw new Error('Choose a certification type.')
  if (typeof input.published !== 'boolean' || !Number.isSafeInteger(input.sort_order) || Math.abs(Number(input.sort_order)) > 1000000) throw new Error('Enter a valid publication setting and display order.')
  const target_date = date(content.target_date, 'Target date'), issue_date = date(content.issue_date, 'Issue date'), expiry_date = date(content.expiry_date, 'Expiry date')
  if (issue_date && expiry_date && expiry_date < issue_date) throw new Error('Expiry date must be on or after the issue date.')
  return {type_id: Number(input.type_id), holder, status, published: input.published, sort_order: Number(input.sort_order), content: {scope: localizedValue(content.scope, 'Scope'), target_date, issue_date, expiry_date, certificate_number: text(content.certificate_number, 'Certificate number'), document: assetUrl(content.document)}}
}
