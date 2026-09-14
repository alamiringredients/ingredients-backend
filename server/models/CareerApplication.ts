import {belongsTo, defineModel, hasMany} from '@holo-js/db'

export default defineModel('career_applications', {
    relations: {
      job: belongsTo('CareerJob', 'job_id'),
      replies: hasMany('CareerReply', 'application_id'),
    },
    fillable: [
      'job_id',
      'job_title',
      'name',
      'email',
      'phone',
      'department',
      'letter',
      'locale',
      'status',
      'cv_path',
      'cv_name',
      'submission_key',
    ],
})
