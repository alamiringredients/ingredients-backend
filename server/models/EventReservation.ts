import {belongsTo, defineModel} from '@holo-js/db'
import {EventReservationObserver} from '@/server/db/observers/EventReservationObserver'
export default defineModel('event_reservations', {
  fillable: ['slot_id', 'status', 'name', 'company', 'email', 'country', 'dial_code', 'phone', 'topic', 'message', 'locale', 'submission_key', 'mail_status', 'message_id', 'reserved_at'],
  observers: [EventReservationObserver],
  relations: {slot: belongsTo('EventSlot', 'slot_id')},
})
