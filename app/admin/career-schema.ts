import {field, schema} from '@holo-js/forms/schema'

export const applicationReplyForm=schema({applicationId:field.number().required().integer().min(1),subject:field.string().required('Enter a subject.').max(200).custom(value=>!/\r|\n/.test(value),'Use one line for the subject.'),body:field.string().required('Enter a reply.').max(20000),key:field.string().required().uuid()})
export const applicationStatusForm=schema({applicationId:field.number().required().integer().min(1),status:field.string().required().in(['pending','accepted','declined'])})
