import 'server-only'
import {DB} from '@holo-js/db'
import Event from '@/server/models/Event'
import EventSlot from '@/server/models/EventSlot'
import EventReservation from '@/server/models/EventReservation'
import type {EventContent} from '@/lib/events/contracts'
import {normalizeEventContent} from '@/lib/events/content'
import {decodeStoredJson} from '@/lib/cms/stored-json'

export type MeetingReservationInput = {slotId: number; eventId: number; name: string; company: string; email: string; country: string; dialCode: string; phone: string; topic: string; message?: string; locale: string; key: string}
export async function reserveEventSlot(input: MeetingReservationInput) {
  return DB.writeTransaction(async () => {
    const slot = await EventSlot.where('id', input.slotId).where('event_id', input.eventId).first()
    if (!slot) throw new Error('This appointment no longer exists.')
    const existing = await EventReservation.where('submission_key', input.key).first()
    const event = await Event.find(input.eventId)
    if (!event) throw new Error('This event no longer exists.')
    const eventData = {id: Number(event.id), slug: event.slug, kind: event.kind === 'recap' ? 'recap' as const : 'event' as const, published: event.published, sort_order: event.sort_order, starts_at: event.starts_at.toISOString(), ends_at: event.ends_at.toISOString(), timezone: event.timezone, content: normalizeEventContent(decodeStoredJson<EventContent>(event.content))}
    if (existing) {
      if (Number(existing.slot_id) !== input.slotId || existing.email !== input.email || existing.status !== 'reserved') throw new Error('This request could not be completed.')
      return {reservationId: Number(existing.id), slotId: input.slotId, startsAt: slot.starts_at, endsAt: slot.ends_at, event: eventData, created: false}
    }
    if (!event.published || new Date(event.ends_at as string | Date) <= new Date()) throw new Error('This event is no longer available for meetings.')
    if (slot.status !== 'available' || new Date(slot.starts_at as string | Date) <= new Date()) throw new Error('That appointment has just been reserved. Please choose another time.')
    const claimed = await EventSlot.where('id', input.slotId).where('event_id', input.eventId).where('status', 'available').update({status: 'reserved'})
    if (claimed.affectedRows !== 1) throw new Error('That appointment has just been reserved. Please choose another time.')
    const reservation = await EventReservation.create({slot_id: input.slotId, status: 'reserved', name: input.name, company: input.company, email: input.email, country: input.country, dial_code: input.dialCode, phone: input.phone, topic: input.topic, message: input.message ?? '', locale: input.locale, submission_key: input.key, mail_status: 'pending', reserved_at: new Date()})
    return {reservationId: Number(reservation.id), slotId: input.slotId, startsAt: slot.starts_at, endsAt: slot.ends_at, event: eventData, created: true}
  })
}
