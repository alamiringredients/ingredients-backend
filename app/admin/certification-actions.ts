'use server'

import { requireAdminPermission } from '@/server/admin/authorization'
import { adminActionError,redirectCreatedRecord } from '@/server/admin/form-actions'
import { validateCertification,validateCertificationType } from '@/lib/certifications/validation'
import Certification from '@/server/models/Certification'
import CertificationTranslation from '@/server/models/CertificationTranslation'
import CertificationType from '@/server/models/CertificationType'
import CertificationTypeTranslation from '@/server/models/CertificationTypeTranslation'
import {DB} from '@holo-js/db'
import {cmsLocales} from '@/lib/cms/contracts'
import type {Certification as CertificationRecord, CertificationType as CertificationTypeRecord} from '@/lib/certifications/contracts'

export async function saveCertificationRecord(kind:'certification'|'certification-type',id:number,payload:string) {
  try {
    if (!['certification', 'certification-type'].includes(kind) || !Number.isSafeInteger(id) || id < 0) throw new Error('Invalid record.')
    await requireAdminPermission(kind === 'certification' ? 'certifications' : 'certification_types', id ? 'edit' : 'create')
    if (typeof payload !== 'string' || payload.length > 100000) throw new Error('Certification content is too large.')
    const input: unknown = JSON.parse(payload)
    let savedId = id
    if (kind === 'certification-type') {
      const values = validateCertificationType(input)
      const duplicate = await CertificationType.where('slug', values.slug).firstJson()
      if (duplicate && Number(duplicate.id) !== id) return {ok: false, message: 'Please correct the highlighted fields.', errors: {slug: ['This slug is already in use.']}}
      savedId = await persistCertification(kind, id, values)
    } else {
      const values = validateCertification(input)
      if (!await CertificationType.where('id', values.type_id).firstJson()) return {ok: false, message: 'Please correct the highlighted fields.', errors: {type_id: ['Choose an existing certification type.']}}
      const duplicate = await Certification.where('type_id', values.type_id).where('holder', values.holder).firstJson()
      if (duplicate && Number(duplicate.id) !== id) return {ok: false, message: 'This holder already has this certification. Edit its existing record.'}
      savedId = await persistCertification(kind, id, values)
    }
    
    await redirectCreatedRecord(id,savedId,kind==='certification'?'/admin/certifications':'/admin/certification-types',kind==='certification'?'certifications':'certification_types')
    return {ok: true, message: 'Saved.', id: savedId}
  } catch(error){return adminActionError(error)}
}

export async function deleteCertificationRecord(kind:'certification'|'certification-type',id:number) {
  try {
    if (!['certification', 'certification-type'].includes(kind) || !Number.isSafeInteger(id) || id < 1) throw new Error('Invalid record.')
    await requireAdminPermission(kind === 'certification' ? 'certifications' : 'certification_types', 'delete')
    if (kind === 'certification-type') {
      if (await Certification.where('type_id', id).firstJson()) throw new Error('Remove or reassign this type’s certifications first, including drafts.')
      await (await CertificationType.findOrFail(id)).delete()
    } else await (await Certification.findOrFail(id)).delete()
    
    return {ok: true, message: 'Deleted.'}
  } catch (error) {return {ok: false, message: error instanceof Error ? error.message : 'Could not delete certification.'}}
}

async function persistCertification(kind: 'certification' | 'certification-type', id: number, values: ReturnType<typeof validateCertification> | ReturnType<typeof validateCertificationType>) {
  return DB.writeTransaction(async () => {
    if (kind === 'certification-type') {
      const {content, ...attributes} = values as Omit<CertificationTypeRecord, 'id'>
      const record = id
        ? await CertificationType.findOrFail(id)
        : await CertificationType.create({...attributes, kind: content.kind, logo: content.logo, badge: content.badge})
      if (id) await record.update({...attributes, kind: content.kind, logo: content.logo, badge: content.badge})
      for (const locale of cmsLocales) {
        await CertificationTypeTranslation.upsert(
          {type_id: Number(record.id), locale},
          {name: content.name[locale], description: content.description[locale]},
        )
      }
      return Number(record.id)
    }

    const {content, ...attributes} = values as Omit<CertificationRecord, 'id'>
    const dates = {
      target_date: content.target_date ? new Date(`${content.target_date}T00:00:00.000Z`) : null,
      issue_date: content.issue_date ? new Date(`${content.issue_date}T00:00:00.000Z`) : null,
      expiry_date: content.expiry_date ? new Date(`${content.expiry_date}T00:00:00.000Z`) : null,
    }
    const record = id
      ? await Certification.findOrFail(id)
      : await Certification.create({...attributes, ...dates, certificate_number: content.certificate_number, document: content.document})
    if (id) await record.update({...attributes, ...dates, certificate_number: content.certificate_number, document: content.document})
    for (const locale of cmsLocales) {
      await CertificationTranslation.upsert(
        {certification_id: Number(record.id), locale},
        {scope: content.scope[locale]},
      )
    }
    return Number(record.id)
  })
}
