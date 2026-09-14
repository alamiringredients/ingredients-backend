import {field, schema} from '@holo-js/forms/schema'

export const eventForm=schema({
  slug:field.string().required('Enter a URL slug.').max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'Use lowercase letters, numbers and single hyphens.'),
  kind:field.string().required('Choose an event type.').in(['event','recap']),
  published:field.boolean().default(false),
  sort_order:field.number().required('Enter a display order.').integer(),
  starts_at:field.string().required('Choose a start time.').custom(value=>Number.isFinite(Date.parse(value)),'Choose a valid start time.'),
  ends_at:field.string().required('Choose an end time.').custom(value=>Number.isFinite(Date.parse(value)),'Choose a valid end time.'),
  timezone:field.string().required('Enter a time zone.').custom(value=>{try{new Intl.DateTimeFormat('en',{timeZone:value});return true}catch{return false}},'Enter a valid IANA time zone.'),
})

export const eventSlotGeneratorForm=schema({
  eventId:field.number().required().integer().min(1),date:field.string().required('Choose a date.').regex(/^\d{4}-\d{2}-\d{2}$/,'Choose a valid date.'),startTime:field.string().required().regex(/^\d{2}:\d{2}$/,'Choose a valid start time.'),endTime:field.string().required().regex(/^\d{2}:\d{2}$/,'Choose a valid end time.'),duration:field.number().required().integer().min(10).max(240),
})

export const meetingReservationForm=schema({
  slotId:field.number().required('Choose a meeting time.').integer().min(1),
  eventId:field.number().required('Choose an event.').integer().min(1),
  name:field.string().required('Enter your name.').max(150).transform(value=>value.trim()),
  company:field.string().required('Enter your company.').max(200).transform(value=>value.trim()),
  email:field.string().required('Enter your email.').email('Enter a valid work email.').max(200).transform(value=>value.trim().toLowerCase()),
  country:field.string().required('Choose your country.').max(120),dialCode:field.string().required('Choose a dialling code.').max(12),phone:field.string().required('Enter your phone number.').max(50).transform(value=>value.trim()),topic:field.string().required('Choose a topic.').max(160),message:field.string().max(10000).optional(),consent:field.boolean().required().custom(value=>value===true,'Consent is required.'),locale:field.string().required().in(['en','ar','fr']),key:field.string().required().uuid(),website:field.string().max(200).optional(),
})
