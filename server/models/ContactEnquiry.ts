import {defineModel, hasMany} from '@holo-js/db'

export default defineModel('contact_enquiries', {
    relations: {replies: hasMany('ContactReply', 'enquiry_id')},
    fillable: [
      'source',
      'status',
      'name',
      'email',
      'company',
      'job_title',
      'country',
      'dial_code',
      'phone',
      'website',
      'industry',
      'product',
      'volume',
      'channel',
      'message',
      'locale',
      'submission_key',
    ],
})
