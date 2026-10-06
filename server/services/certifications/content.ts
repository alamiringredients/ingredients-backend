import {resolveMediaReferences} from '@/server/support/media-references'
import 'server-only'

import cache from '@holo-js/cache'
import {databaseDate} from '@/server/support/database-date'
import type {CmsLocale} from '@/lib/cms/contracts'
import type {CertificationData, Certification, CertificationType} from '@/lib/certifications/contracts'
import CertificationModel from '@/server/models/Certification'
import CertificationTypeModel from '@/server/models/CertificationType'
import '@/server/models/CertificationTranslation'
import '@/server/models/CertificationTypeTranslation'
import {contentCacheKeys} from '@/server/support/cache-keys'

type Row = Record<string, unknown>

export async function getCertifications(includeDrafts = false, locale?: CmsLocale): Promise<CertificationData> {
  const read = async () => {
    const recordsQuery = CertificationModel.with('translations')
      .orderBy('sort_order').orderBy('id')
    const typesQuery = CertificationTypeModel.with('translations').orderBy('id')
    const [records, types] = await Promise.all([
      (includeDrafts ? recordsQuery : recordsQuery.where('published', true)).getJson(),
      typesQuery.getJson(),
    ])
    return {records, types}
  }
  const stored = !includeDrafts && locale ? await cache.rememberForever(contentCacheKeys.certifications, read) : await read()
  const certifications: Certification[] = stored.records.map(row => ({
      id: Number(row.id),
      type_id: Number(row.type_id),
      holder: row.holder as Certification['holder'],
      status: row.status as Certification['status'],
      published: Boolean(row.published),
      sort_order: Number(row.sort_order),
      content: {
        scope: Object.fromEntries((row.translations as Row[]).filter(item => !locale || item.locale === locale).map(item => [String(item.locale), String(item.scope)])) as Certification['content']['scope'],
        target_date: databaseDate(row.target_date),
        issue_date: databaseDate(row.issue_date),
        expiry_date: databaseDate(row.expiry_date),
        certificate_number: String(row.certificate_number),
        document: String(row.document),
      },
    }))
    const typeIds = new Set(certifications.map(record => record.type_id))
    const certificationTypes: CertificationType[] = stored.types.filter(row => includeDrafts || typeIds.has(Number(row.id))).map(row => ({
      id: Number(row.id),
      slug: String(row.slug),
      content: {
        kind: row.kind,
        logo: row.logo,
        badge: row.badge,
        name: Object.fromEntries((row.translations as Row[]).filter(item => !locale || item.locale === locale).map(item => [String(item.locale), String(item.name)])),
        description: Object.fromEntries((row.translations as Row[]).filter(item => !locale || item.locale === locale).map(item => [String(item.locale), String(item.description)])),
      },
    } as CertificationType))
  return resolveMediaReferences({certifications, types: certificationTypes})
}
