import {belongsTo, defineModel, hasOne} from '@holo-js/db'
import {EventSlotObserver} from '@/server/db/observers/EventSlotObserver'
export default defineModel('event_slots', {
  fillable: ['event_id', 'starts_at', 'ends_at', 'status'],
  observers: [EventSlotObserver],
  relations: {event: belongsTo('Event', 'event_id'), reservation: hasOne('EventReservation', 'slot_id')},
})
