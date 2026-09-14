import {belongsTo, defineModel} from '@holo-js/db'

export default defineModel('career_replies', {
    relations: {application: belongsTo('CareerApplication', 'application_id')},
    fillable: [
      'application_id',
      'subject',
      'body',
      'status',
      'message_id',
      'request_key',
    ],
})
