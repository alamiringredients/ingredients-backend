import 'server-only'
import {sendMail} from '@holo-js/mail'
import EventReservation from '@/server/models/EventReservation'
import MeetingConfirmationMail from '@/server/mail/meeting-confirmation'

export async function sendReservationConfirmation(
  reservationId: number,
  input: Parameters<typeof MeetingConfirmationMail>[0],
) {
  try {
    const sent = await sendMail(MeetingConfirmationMail(input))
    await (await EventReservation.findOrFail(reservationId)).update({
      mail_status: 'sent',
      message_id: sent.messageId,
    })
  } catch {
    await (await EventReservation.findOrFail(reservationId)).update({mail_status: 'failed'})
  }
}
