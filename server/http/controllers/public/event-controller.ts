import {resolveMediaReferences} from '@/server/support/media-references'
import 'server-only'

import cache from '@holo-js/cache'
import type {CmsLocale} from '@/lib/cms/contracts'
import type {EventRecord, PublicEventSlot} from '@/lib/events/contracts'
import type {ManagedPageContent} from '@/lib/cms/contracts'
import {getTranslationDefinitions, resolveTranslationDefinitions, type TranslationEntry} from '@/lib/translation-catalog'
import {requireContent} from '@/lib/cms/stored-json'
import {getEventInterfaceDefinitions} from '@/server/db/seed-data/event-interface-definitions'
import {contentCacheKeyForPage} from '@/server/support/cache-keys'
import Event from '@/server/models/Event'
import WebsiteSetting from '@/server/models/WebsiteSetting'
import ContentTranslation from '@/server/models/ContentTranslation'
import '@/server/models/EventSlot'
import '@/server/models/ContentTranslationValue'
import {field, schema, validate, isValidationException} from '@holo-js/forms'

type Row = Record<string, unknown>

async function getEventsPayload(locale: CmsLocale, page = 'events', slug?: string, now = new Date()) {
  const interfaceDefinitions = getEventInterfaceDefinitions()
  const pageDefinitions = getTranslationDefinitions().filter(entry => ['events', 'events/event', 'events/recap', 'book-a-meeting'].includes(entry.page))
  const definitions = [...interfaceDefinitions, ...pageDefinitions]
  const stored = await cache.rememberForever(contentCacheKeyForPage('events', locale), async () => {
    const [events, settings, translationEntities] = await Promise.all([
      Event.with('slots').where('published', true).orderBy('sort_order').orderBy('starts_at').getJson(),
      WebsiteSetting.whereIn('setting_key', ['events', 'book-a-meeting']).getJson(),
      ContentTranslation.with({values: query => query.where('locale', locale)})
        .where(query => query.whereIn('translation_key', definitions.map(entry => entry.key)).orWhere(group => group.whereIn('source', definitions.map(entry => entry.source))))
        .getJson() as unknown as Promise<Row[]>,
    ])
    return {events, settings, translationEntities}
  })
  const toEventRecord = (row: Row): EventRecord => ({
    id: Number(row.id), slug: String(row.slug), kind: row.kind === 'recap' ? 'recap' : 'event', published: true,
    sort_order: Number(row.sort_order), starts_at: new Date(String(row.starts_at)).toISOString(), ends_at: new Date(String(row.ends_at)).toISOString(), timezone: String(row.timezone),
    content: requireContent<EventRecord['content']>(row.content, 'Event'),
  })
  const selected = slug ? stored.events.find(row => row.slug === slug) : undefined
  const event = selected ? toEventRecord(selected) : null
  const pageKey = event ? event.kind === 'recap' ? 'events/recap' : 'events/event' : page
  const isBookingPage = page === 'book-a-meeting'
  const available = stored.events.filter(row => row.kind === 'event' && new Date(String(row.ends_at)) > now)
  const eligibleIds = new Set(available.map(row => Number(row.id)))
  const eventRank = new Map(stored.events.map((row, index) => [Number(row.id), index]))
  const slots: PublicEventSlot[] = isBookingPage ? stored.events.flatMap(row => (row.slots as Row[])
    .filter(slot => eligibleIds.has(Number(row.id)) && new Date(String(slot.starts_at)) > now)
    .map(slot => ({id: Number(slot.id), eventId: Number(row.id), startsAt: new Date(String(slot.starts_at)).toISOString(), endsAt: new Date(String(slot.ends_at)).toISOString(), status: slot.status === 'reserved' ? 'reserved' as const : 'available' as const})))
    .sort((left, right) => Number(eventRank.get(left.eventId)) - Number(eventRank.get(right.eventId)) || left.startsAt.localeCompare(right.startsAt)) : []
  const setting = stored.settings.find(row => row.setting_key === pageKey)
  const translations: TranslationEntry[] = stored.translationEntities.map(row => ({
    key: String(row.translation_key), page: String(row.page), source: String(row.source),
    translations: {[locale]: String(((row.values as Row[])[0]?.value) ?? '')} as TranslationEntry['translations'],
  }))
  return {
    events: (isBookingPage ? available.filter(row => slots.some(slot => slot.eventId === Number(row.id))) : stored.events).map(row => toEventRecord(row)), event, slots,
    managedContent: setting ? requireContent<ManagedPageContent>(setting.value, 'Events page') : null,
    translations: resolveTranslationDefinitions(pageDefinitions.filter(entry => entry.page === pageKey), translations),
    labels: Object.fromEntries(resolveTranslationDefinitions(interfaceDefinitions, translations).map(entry => [entry.key.replace('event.interface.', ''), entry.translations[locale]])),
  }
}

export async function payload(request: Request) {
  try {
    const search = new URL(request.url).searchParams
    const {locale} = await validate({locale: search.get('locale')?.trim()}, schema({locale: field.string().required().in(['en','ar','fr'])}))
    const data = await getEventsPayload(locale, search.get('page') === 'book-a-meeting' ? 'book-a-meeting' : 'events', search.get('slug') ?? undefined)
    return Response.json({data: await resolveMediaReferences(data)}, {headers: {'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'}})
  } catch (error) {
    if (isValidationException(error)) return Response.json({message: error.message}, {status: error.status})
    console.error('Public events request failed', error)
    return Response.json({message: 'Unable to load content.'}, {status: 500})
  }
}
