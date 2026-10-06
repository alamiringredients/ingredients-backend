import {resolveMediaReferences} from '@/server/support/media-references'
import 'server-only'

import cache from '@holo-js/cache'
import type {QualityPageContent} from '@/lib/cms/contracts'
import {requireContent} from '@/lib/cms/stored-json'
import {getCertificationTranslationDefinitions} from '@/server/db/seed-data/certification-translation-definitions'
import {buildCertificationInterfaceLabels} from '@/server/services/certifications/interface'
import {databaseDate} from '@/server/support/database-date'
import type {Certification, CertificationType} from '@/lib/certifications/contracts'
import {resolveTranslationDefinitions, getTranslationDefinitions, type TranslationEntry} from '@/lib/translation-catalog'
import {contentCacheKeyForPage} from '@/server/support/cache-keys'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import ContentTranslation from '@/server/models/ContentTranslation'
import CertificationModel from '@/server/models/Certification'
import CertificationTypeModel from '@/server/models/CertificationType'
import '@/server/models/CertificationTranslation'
import '@/server/models/CertificationTypeTranslation'
import '@/server/models/ContentTranslationValue'
import {field, schema, validate, isValidationException} from '@holo-js/forms'

type Row = Record<string, unknown>

export async function GET(request: Request) {
  try {
    const search = new URL(request.url).searchParams
    const {locale} = await validate({locale: search.get('locale')?.trim()}, schema({locale: field.string().required().in(['en','ar','fr'])}))
    const data = await cache.rememberForever(contentCacheKeyForPage('quality', locale), async () => {
    const certificationDefinitions = getCertificationTranslationDefinitions()
    const pageDefinitions = getTranslationDefinitions().filter(entry => entry.page === 'quality')
    const definitions = [...certificationDefinitions, ...pageDefinitions]
    const [setting, certificationRows, certificationTypeRows, translationEntities] = await Promise.all([
      WebsiteSetting.where('setting_key', 'quality').firstJson(),
      CertificationModel.with({translations: query => query.where('locale', locale)}).where('published', true).orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      CertificationTypeModel.with({translations: query => query.where('locale', locale)}).orderBy('id').getJson() as unknown as Promise<Row[]>,
      ContentTranslation.with({values: query => query.where('locale', locale)})
        .where(query => query.whereIn('translation_key', definitions.map(entry => entry.key)).orWhere(group => group.whereIn('source', definitions.map(entry => entry.source))))
        .getJson() as unknown as Promise<Row[]>,
    ])
    if (!setting) throw new Error('Quality page content is missing. Run the quality_page seeder.')
    const translations: TranslationEntry[] = translationEntities.map(row => ({
      key: String(row.translation_key), page: String(row.page), source: String(row.source),
      translations: {[locale]: String((row.values as Row[])[0]?.value ?? '')} as TranslationEntry['translations'],
    }))
    const certifications: Certification[] = certificationRows.map(row => ({
      id: Number(row.id), type_id: Number(row.type_id), holder: row.holder as Certification['holder'], status: row.status as Certification['status'], published: true, sort_order: Number(row.sort_order),
      content: {scope: Object.fromEntries((row.translations as Row[]).map(item => [String(item.locale), String(item.scope)])) as Certification['content']['scope'], target_date: databaseDate(row.target_date), issue_date: databaseDate(row.issue_date), expiry_date: databaseDate(row.expiry_date), certificate_number: String(row.certificate_number), document: String(row.document)},
    }))
    const typeIds = new Set(certifications.map(record => record.type_id))
    const types: CertificationType[] = certificationTypeRows.filter(row => typeIds.has(Number(row.id))).map(row => ({
      id: Number(row.id), slug: String(row.slug), content: {kind: row.kind, logo: row.logo, badge: row.badge, name: Object.fromEntries((row.translations as Row[]).map(item => [String(item.locale), String(item.name)])), description: Object.fromEntries((row.translations as Row[]).map(item => [String(item.locale), String(item.description)]))},
    } as CertificationType))
    const certificationLabels = Object.fromEntries(resolveTranslationDefinitions(certificationDefinitions, translations).map(entry => [entry.key.replace('certification.interface.', ''), entry.translations[locale]]))
    return {
      content: requireContent<QualityPageContent>(setting.value, 'Quality page'),
      certifications: {certifications, types},
      labels: buildCertificationInterfaceLabels(certificationLabels),
      translations: resolveTranslationDefinitions(pageDefinitions, translations),
    }
    })
    return Response.json({data: await resolveMediaReferences(data)}, {headers: {'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'}})
  } catch (error) {
    if (isValidationException(error)) return Response.json({message: error.message}, {status: error.status})
    console.error('Public quality request failed', error)
    return Response.json({message: 'Unable to load content.'}, {status: 500})
  }
}
