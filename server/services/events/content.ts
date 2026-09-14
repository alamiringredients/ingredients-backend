import cache from '@holo-js/cache'
import {paginateCrud} from '@/server/admin/crud-query'
import type {ListSearchParams} from '@/lib/admin/submission-list'
import "server-only";
import Event from "@/server/models/Event";
import {DB} from "@holo-js/db";
import {contentCacheKeys} from "@/server/support/cache-keys";
import type {
  EventContent,
  EventRecord,
  EventSlotRecord,
} from "@/lib/events/contracts";
import { normalizeEventContent } from "@/lib/events/content";


const decode = <T>(value: unknown): T =>
  (typeof value === "string" ? JSON.parse(value) : value) as T;
const iso = (value: unknown) => new Date(value as string | Date).toISOString();

export async function getEvents(): Promise<EventRecord[]> {
  return cache.rememberForever(contentCacheKeys.events, async () =>
    (await Event.orderBy("sort_order").orderBy("starts_at").getJson()).map(
      (row) => ({
        id: Number(row.id),
        slug: String(row.slug),
        kind: row.kind === "recap" ? "recap" : "event",
        published: Boolean(row.published),
        sort_order: Number(row.sort_order),
        starts_at: iso(row.starts_at),
        ends_at: iso(row.ends_at),
        timezone: String(row.timezone),
        content: normalizeEventContent(decode<EventContent>(row.content)),
        created_at: iso(row.created_at),
        updated_at: iso(row.updated_at),
      }),
    ),
  );
}

export async function getEventSlotList(eventId: number, params: ListSearchParams) {
  const query = DB.table("event_slots").leftJoin("event_reservations", "event_reservations.slot_id", "=", "event_slots.id").select("event_slots.id", "event_slots.event_id", "event_slots.starts_at", "event_slots.ends_at", "event_slots.status", "name", "company", "email", "country", "dial_code", "phone", "topic", "message", "locale", "mail_status", "message_id", "reserved_at").orderBy("event_slots.starts_at").where('event_slots.event_id', eventId).orderBy('event_slots.id')
  const filters = [{key: 'status', label: 'Status', options: [{value: 'available', label: 'Available'}, {value: 'reserved', label: 'Reserved'}]}]
  const result = await paginateCrud(query, params, filters,
    (query, pattern) => query.where(group => group.where('name', 'like', pattern).orWhere('email', 'like', pattern).orWhere('company', 'like', pattern)),
    (query, _key, value) => query.where('event_slots.status', value))
  const slots: EventSlotRecord[] = result.rows.map(row => ({
      id: Number(row.id),
      eventId: Number(row.event_id),
      startsAt: iso(row.starts_at),
      endsAt: iso(row.ends_at),
      status: row.status === "reserved" ? "reserved" : "available",
      reservationName: String(row.name ?? ""),
      reservationCompany: String(row.company ?? ""),
      reservationEmail: String(row.email ?? ""),
      reservationCountry: String(row.country ?? ""),
      reservationDialCode: String(row.dial_code ?? ""),
      reservationPhone: String(row.phone ?? ""),
      reservationTopic: String(row.topic ?? ""),
      reservationMessage: String(row.message ?? ""),
      reservationLocale: String(row.locale ?? "en"),
      mailStatus: String(row.mail_status ?? ""),
      messageId: String(row.message_id ?? ""),
      reservedAt: row.reserved_at ? iso(row.reserved_at) : null,
    }))
  return {slots, pagination: result.pagination}
}
