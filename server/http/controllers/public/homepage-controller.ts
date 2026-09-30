import 'server-only'

import cache from '@holo-js/cache'
import type {HomeCmsData} from '@/lib/cms/contracts'
import type {EventRecord} from '@/lib/events/contracts'
import {requireContent} from '@/lib/cms/stored-json'
import {resolveTranslationDefinitions, type TranslationEntry} from '@/lib/translation-catalog'
import {getCertificationTranslationDefinitions} from '@/server/db/seed-data/certification-translation-definitions'
import {buildCertificationInterfaceLabels} from '@/server/services/certifications/interface'
import {databaseDate} from '@/server/support/database-date'
import type {Certification, CertificationType} from '@/lib/certifications/contracts'
import {contentCacheKeyForPage} from '@/server/support/cache-keys'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import HomeSection from '@/server/models/HomeSection'
import Event from '@/server/models/Event'
import ContentTranslation from '@/server/models/ContentTranslation'
import CertificationModel from '@/server/models/Certification'
import CertificationTypeModel from '@/server/models/CertificationType'
import '@/server/models/CertificationTranslation'
import '@/server/models/CertificationTypeTranslation'
import '@/server/models/EventSlot'
import '@/server/models/ContentTranslationValue'
import {field, schema, validate, isValidationException} from '@holo-js/forms'
import countryNames from '@/lib/cms/country-names.json'

type Row = Record<string, unknown>

export async function GET(request: Request) {
  try {
    const search = new URL(request.url).searchParams
    const {locale} = await validate({locale: search.get('locale')?.trim()}, schema({locale: field.string().required().in(['en','ar','fr'])}))
    const stored = await cache.rememberForever(contentCacheKeyForPage('homepage', locale), async () => {
    const definitions = getCertificationTranslationDefinitions()
    const [seo, sections, certificationRows, certificationTypeRows, translationEntities, events, countryTranslations] = await Promise.all([
      WebsiteSetting.where('setting_key', 'home_seo').firstJson(),
      HomeSection.where('enabled', true).whereNotIn('section_key', ['header', 'footer', 'overlays']).orderBy('sort_order').orderBy('id').getJson(),
      CertificationModel.with({translations: query => query.where('locale', locale)}).where('published', true).orderBy('sort_order').orderBy('id').getJson() as unknown as Promise<Row[]>,
      CertificationTypeModel.with({translations: query => query.where('locale', locale)}).orderBy('id').getJson() as unknown as Promise<Row[]>,
      ContentTranslation.with({values: query => query.where('locale', locale)})
        .where(query => query.whereIn('translation_key', definitions.map(entry => entry.key)).orWhere(group => group.whereIn('source', definitions.map(entry => entry.source))))
        .getJson() as unknown as Promise<Row[]>,
      Event.with('slots').where('published', true).where('kind', 'event').orderBy('starts_at').orderBy('id').getJson() as unknown as Promise<Row[]>,
      ContentTranslation.with({values: query => query.where('locale', locale)}).where('page', 'countries').getJson() as unknown as Promise<Row[]>,
    ])
    if (!seo) throw new Error('Homepage SEO content is missing. Run the home_page seeder.')
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
    const values = Object.fromEntries(resolveTranslationDefinitions(definitions, translations).map(entry => [entry.key.replace('certification.interface.', ''), entry.translations[locale]]))
    return {
      home: {sections: sections.map(row => ({...requireContent(row.content, 'Homepage section'), key: String(row.section_key), label: String(row.label), enabled: true})) as HomeCmsData['sections'], seo: requireContent<HomeCmsData['seo']>(seo.value, 'Homepage SEO')},
      certifications: {certifications, types},
      certificationLabels: buildCertificationInterfaceLabels(values),
      countries: countryNames.map(value => ({value, label: String((countryTranslations.find(row => row.source === value)?.values as Row[] | undefined)?.[0]?.value ?? '')})),
      events,
    }
  })
  const now = new Date()
  const meeting = stored.events.find(row => new Date(String(row.ends_at)) > now && (row.slots as Row[]).some(slot => slot.status === 'available' && new Date(String(slot.starts_at)) > now))
  const meetingEvent: EventRecord | null = meeting ? {
    id: Number(meeting.id), slug: String(meeting.slug), kind: 'event', published: true, sort_order: Number(meeting.sort_order),
    starts_at: new Date(String(meeting.starts_at)).toISOString(), ends_at: new Date(String(meeting.ends_at)).toISOString(), timezone: String(meeting.timezone),
    content: requireContent<EventRecord['content']>(meeting.content, 'Event'),
  } : null
    const data = {home: stored.home, certifications: stored.certifications, certificationLabels: stored.certificationLabels, countries: stored.countries, meetingEvent}
    return Response.json({data}, {headers: {'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'}})
  } catch (error) {
    if (isValidationException(error)) return Response.json({message: error.message}, {status: error.status})
    console.error('Public homepage request failed', error)
    return Response.json({message: 'Unable to load content.'}, {status: 500})
  }
}
