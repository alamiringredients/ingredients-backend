import {belongsTo, defineModel} from '@holo-js/db'

export default defineModel('contact_replies', {
    relations: {enquiry: belongsTo('ContactEnquiry', 'enquiry_id')},
    fillable: [
      'enquiry_id',
      'subject',
      'body',
      'status',
      'message_id',
      'request_key',
    ],
})
