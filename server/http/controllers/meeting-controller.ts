import {sendReservationConfirmation} from '@/server/services/events/confirmation'
import {publicFormRoute} from '@/server/http/public-form'
import {validate} from '@holo-js/forms'
import {meetingReservationForm} from '@/server/http/controllers/event-schema'
import {reserveEventSlot} from '@/server/services/events/reservations'
import {textContent} from '@/lib/editor/document'
import type {CmsLocale} from '@/lib/cms/contracts'

export const reserveMeeting = publicFormRoute(async (request: Request) => {
  const input = await validate(request, meetingReservationForm, {throttle: 'meeting-reservation'})
  if (input.website) {
    return Response.json({ok: false, status: 422, valid: false, values: {}, errors: {_root: ['failed']}})
  }
  const reserved = await reserveEventSlot(input)
  if (reserved.created) {
    await sendReservationConfirmation(reserved.reservationId, {
      to: input.email,
      name: input.name,
      event: reserved.event,
      startsAt: reserved.startsAt,
      endsAt: reserved.endsAt,
      locale: input.locale as CmsLocale,
    })
  }
  return Response.json({
    ok: true,
    status: 200,
    data: {
      startsAt: reserved.startsAt.toISOString(),
      endsAt: reserved.endsAt.toISOString(),
      event: textContent(reserved.event.content.title[input.locale as CmsLocale]),
      timezone: reserved.event.timezone,
    },
  })
})
